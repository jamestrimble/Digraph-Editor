$('.btn').button();

var //width = 960,
    height = 350,
    radius = 12,
    loopSize = 20,       // Width in pixels of loop edges
    colourScale = d3.scale.category10(),
    edgeColour = d3.scale.linear().domain([0,10]).range(["#ccc", "black"]),
    drawingArrow = false, // Set to true if one end of an arrow has been drawn
    arrowStart,           // Start position of the arrow that's being drawn
    arrowStartNodeGlobal;         // The arrow's starting node

var svg = d3.select("#svg-div")
    .append("svg")
    //.attr("width", width)
    .attr("height", height);

// Arrow end marker
// http://bl.ocks.org/rkirsling/5001347
svg.append('svg:defs').append('svg:marker')
    .attr('id', 'end-arrow')
    .attr('viewBox', '0 -5 10 10')
    .attr('refX', 6)
    .attr("class", "arrow-head")
    .attr('markerWidth', 5)
    .attr('markerHeight', 5)
    .attr('orient', 'auto')
  .append('svg:path')
    .attr('d', 'M0,-5L10,0L0,5')
    .attr('fill', '#000');

// Just shown when an arrow is being drawn
var dashedArrow = svg.append("path")
        .attr('class', 'dashed-arrow')
        .style('marker-end', 'url(#end-arrow)');

// The graph (in standard JSON format, with extra elements for the d3 circle selectors) 
var G = {};
var fullJson = {"data" : G};

// Display the pretty-printed JSON,
// highlight the connected components,
// and show the list of circuits
var displayJson = function() {
    $('#circuit-output').show();
    $('#json-output').show();
    $('.initially-hidden').show();
    var fullJson_clone = JSON.parse(JSON.stringify(fullJson));   // Clone graph for printing
    for (v in fullJson_clone.data) {
        delete fullJson_clone.data[v].svgCircle;
        delete fullJson_clone.data[v].number;
        delete fullJson_clone.data[v].lowLink;
        delete fullJson_clone.data[v].id;
        delete fullJson_clone.data[v].onStack;
    }
    $('#json-output').html(JSON.stringify(fullJson_clone, undefined, 4));
    
    connectedComps = tarjan(G).components;
    
    console.log(connectedComps);
    
    var colourDomain = [];
    for (var i=0; i<connectedComps.length; i++) {
        colourDomain.push(i);
    }
    colourScale.domain(colourDomain);
    for (var i=0; i<connectedComps.length; i++) {
        for (var j=0; j<connectedComps[i].length; j++) {
            connectedComps[i][j].svgCircle
                .style("fill", colourScale(i));
        }
    }
    
    circuits = johnson(G);
    
    d3.select('#circuit-output').selectAll('pre, p').remove();
    
    // Add circuits, with listeners for highlighting on mouse-over
    if (circuits.length > 0) {
        d3.select('#circuit-output')
            .selectAll('pre')
            .data(circuits).enter()
            .append('pre')
            .attr('class', 'circuit-pre')
            .text(function(d) {return JSON.stringify(d)})
            .on('mouseover', function(d) {
                for (v in G) {
                    if (d.indexOf(+v) != -1 ) {  // if this node is in the circuit
                        G[v].svgCircle.classed('full-opacity', true);
                    } else {
                        G[v].svgCircle.classed('muted-circle', true);
                    }
                }
                d3.selectAll(".arrow").classed("arrow-muted", true);
                for (var i=0; i<d.length-1; i++) {
                    var arrowStartId = d[i];
                    var arrowEndId = d[i+1];
                    d3.selectAll(".arrow")
                        .filter(function() {return d3.select(this).attr("data-start-node") == arrowStartId})
                        .filter(function() {return d3.select(this).attr("data-end-node") == arrowEndId})
                           .classed("arrow-highlight", true)
                           .classed("arrow-muted", false);
                }
            })
            .on('mouseout', function(d) {
                d3.selectAll("circle").classed('muted-circle', false);
                d3.selectAll('.node').classed('full-opacity', false);
                d3.selectAll(".arrow")
                    .classed("arrow-highlight", false)
                    .classed("arrow-muted", false);
            });
    } else {
        // If there are no circuits, show a short message
        d3.select('#circuit-output').append('p').text('None');
    }
    
}

// When the SVG is clicked on, add a circle
svg.on("click", function() {
    // If the Erase button is selected, don't do anything
    if ($("#erase").parent().hasClass("active")) {
        return;
    }
    drawingArrow = false;     // We're not drawing an arrow (even if we had selected one point)
    dashedArrow.style("visibility", "hidden");
    $("#message").css("visibility", "hidden");
    d3.selectAll(".node").classed("node-highlight", false);
    
    var coords = d3.mouse(svg[0][0]);  // Mouse position on SVG
    var node = svg.append("circle")
        .attr("cx", coords[0])
        .attr("cy", coords[1])
        .attr("r", radius)
        .attr("class", "node");
        
    var maxNodeId = 0;
    for (v in G) {
        maxNodeId = Math.max(maxNodeId, +v);    // Max ID of nodes created so far
    }
    
    var nodeId = maxNodeId + 1;
    node.attr('data-nodeid', nodeId);
    var graphNode = {"matches": [], "svgCircle": node};  // Add to the "JSON" graph
    G['' + nodeId] = graphNode;
    
    var nodeNumSvg = svg.append("text")
        .attr("x", coords[0])
        .attr("y", coords[1])
        .text(nodeId)
        .attr("class", "node-num");
        
    displayJson();   // Re-run the algorithms with the new circle
    
    node.on("click", function() {
        d3.event.stopPropagation();    // If a circle has been clicked, don't create a new circle
        if ($("#add_elements").parent().hasClass("active")) {   // If we're in drawing mode, start creating an arrow
            if (!drawingArrow) {    // If first node of edge hasn't been clicked...
                dashedArrow.style("visibility", "visible");
                arrowStartNodeGlobal = graphNode;
                drawingArrow = true;                 
                arrowStart = coords;
                $("#message").text("Click endpoint of edge");
                $("#message").css("visibility", "visible");
                node.classed("node-highlight", true);
            } else {     // Finish off edge
                dashedArrow.style("visibility", "hidden");
                var arrowStartNode = arrowStartNodeGlobal;
                existingLinksHere = arrowStartNode.matches.filter(function(x) {
                                        return x.recipient==nodeId;
                                    }).length;
                if ( (!existingLinksHere) ) {
                    drawingArrow = false;
                    $("#message").css("visibility", "hidden");
                    d3.selectAll(".node").classed("node-highlight", false);
                    var arrowEnd = coords;
                    if (arrowStartNode != graphNode) {   // If edge isn't a loop 
                        var lineLength = Math.sqrt(  Math.pow(arrowEnd[0]-arrowStart[0],2)
                                                   + Math.pow(arrowEnd[1]-arrowStart[1],2));
                        var lineUnitVectorX = (arrowEnd[0]-arrowStart[0]) / lineLength;
                        var lineUnitVectorY = (arrowEnd[1]-arrowStart[1]) / lineLength;
                        var arrowStartX = arrowStart[0] + radius * lineUnitVectorX;
                        var arrowStartY = arrowStart[1] + radius * lineUnitVectorY;
                        var arrowEndX = arrowEnd[0] - radius * lineUnitVectorX;
                        var arrowEndY = arrowEnd[1] - radius * lineUnitVectorY;
                        var arrowPath = 'M' + arrowStartX + ',' + arrowStartY
                                       + 'L' + arrowEndX + ',' + arrowEndY;
                    } else {             // If edge is a loop 
                        var arrowStartX = arrowStart[0] + radius;
                        var arrowStartY = arrowStart[1];
                        var arrowEndX = arrowStart[0] + Math.sqrt(radius*radius);
                        var arrowEndY = arrowStart[1] + Math.sqrt(radius*radius);
                        var arrowPath = 'M' + arrowStartX + ',' + arrowStartY
                                       + 'L' + (arrowStartX + loopSize) + ',' + arrowStartY                         
                                       + 'L' + (arrowStartX + loopSize/2) + ',' + (arrowStartY + loopSize)
                                       + 'L' + arrowEndX + ',' + arrowEndY                         
                    }
                    var edgeWeight = +$("#weight-input").val();
                    var arrow = svg.append("path")
                            .style("stroke", edgeColour(edgeWeight))
                            .style('marker-end', 'url(#end-arrow)')
                            .attr('d', arrowPath)
                            .attr("class", "arrow")
                            .attr("data-start-node", arrowStartNode.id)
                            .attr("data-end-node", graphNode.id);  
                    arrowStartNode.matches.push({"recipient": nodeId, "score": edgeWeight});
                    displayJson();

                    arrow.on("click", function() {
                        if ($("#erase").parent().hasClass("active")) {
                            d3.event.stopPropagation();
                            arrow.style("visibility", "hidden");
                            for (var i=0; i<arrowStartNode.matches.length; i++) {
                                if (arrowStartNode.matches[i].recipient==nodeId) {
                                    arrowStartNode.matches.splice(i, 1);
                                    break;
                                }
                            }
                            displayJson();                               
                        }
                    });
                }
            }
        } else {      // Delete node
            node.style("visibility", "hidden");
            nodeNumSvg.style("visibility", "hidden");
            delete G['' + nodeId];
            for (v in G) {
                for (var i=0; i<G[v].matches.length; i++) {
                    if (G[v].matches[i].recipient==nodeId) {
                        G[v].matches.splice(i, 1);
                        i--;
                    }
                }
            }
            displayJson();
        }
    });
});

svg.on("mousemove", function() {
    if (drawingArrow) {  // Move the dashed arrow
        var coords = d3.mouse(svg[0][0]);
        var edgeWeight = +$("#weight-input").val();
        dashedArrow
               .style("stroke", edgeColour(edgeWeight))
               .attr('d', 'M' + arrowStart[0] + ',' + arrowStart[1] 
                           + 'L' + coords[0] + ',' + coords[1]);
    }
});


// Run the algorithms on the second (paste JSON) tab
$('#json-button').click(function() {
    var json = $('#json-input').val();
    try {
        var inputG = JSON.parse(json);
        $('#invalid-json-message').css('visibility', 'hidden');
        var validJson = true;
    } catch (e) {
        $('#invalid-json-message').css('visibility', 'visible');
        var validJson = false;
    }
    if (validJson) {
        var components = tarjan(inputG.data).components;
        var simpleComponents = components
                .map(function(x) {
                    return x.map(function(y) {
                        return +y.id;
                    })
                });
        var circuits = johnson(inputG.data);
        var adjacencies = {};
        for (v_id in inputG.data) {
            if (inputG.data[v_id].hasOwnProperty("matches")) {
                adjacencies[v_id] = inputG.data[v_id].matches.map(function(x) {
                   return x.recipient; 
                });
            } else {
                adjacencies[v_id] = [];
            }
        }
        
        $('#json-adjacency-list').text(JSON.stringify(adjacencies).replace(/,"/g, ',\n "'));
        $('#json-components').text(JSON.stringify(simpleComponents).replace(/,\[/g, ',\n [').replace("]]", "]\n]"));
        $('#json-circuits').text(JSON.stringify(circuits).replace(/,\[/g, ',\n [').replace("]]", "]\n]"));
    }
    
    
    
});


/*d3.json("input_modified.json", function(data) {
    var G2 = data.data;
    


})*/
