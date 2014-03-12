// Returns an object with fields:
//    components: an array of components (with each component as an array)
//    compWithLeastVertex: the index of the component with least vertex
var tarjan = function(G) {

    var sccList = [],
        compWithLeastVertex = null,  // The index of the strong component with at least
                                     // two vertices with the least vertex (for Johnson)
        leastVertexInAComponentSoFar = Infinity;
    
    for(v_id in G) {
        G[v_id].id = v_id;
        G[v_id].matches = G[v_id].matches || [];
        G[v_id].number = null;
        G[v_id].onStack = false;
    }
    
    for(v_id in G) {
        if (G[v_id].altruistic) {
            for (w in G) {
                if (w != v_id && !G[w].altruistic) {
                    G[w].matches.push({"recipient":+v_id, "score":-1});
                }
            }
        }
    }
    
    var i=0;
    
    var stack = [];
    
    var strongConnect = function(v) {
        i += 1;
        v.lowLink = v.number = i;
        if (stack.indexOf(v) != -1) alert("Possible error!");
        stack.push(v);
        v.onStack = true;
        for (var j=0; j<v.matches.length; j++) {
            var w = G[v.matches[j].recipient + ''];
            if (w.number === null) {
                strongConnect(w);
                v.lowLink = Math.min(v.lowLink, w.lowLink);
            } else if (w.onStack) {
                // Using Wikipedia version (since the test for w.number < v.number seems unnecessary)
                v.lowLink = Math.min(v.lowLink, w.number);
            }
        }
        if (v.lowLink === v.number) {
            var component = [];
            sccList.push(component);
            var leastVertexInThisComponent = Infinity;
            while (stack.length && stack[stack.length-1].number >= v.number ) {
                stack[stack.length-1].onStack = false;
                leastVertexInThisComponent = Math.min(leastVertexInThisComponent,
                                                      +stack[stack.length-1].id);
                component.push(stack.pop());
            }
            // Save index of component with least vertex
            if (component.length > 1
                    && leastVertexInThisComponent < leastVertexInAComponentSoFar) {   
                leastVertexInAComponentSoFar = leastVertexInThisComponent;
                compWithLeastVertex = sccList.length - 1;
            }
        }
    }
    
    for(v_id in G) {
        //console.log("node " + v_id);
        if (!G[v_id].number) {
            strongConnect(G[v_id]);
        }
        //console.log(G[v].id);
    }
    //console.log({components: sccList, compWithLeastVertex: compWithLeastVertex});
    return {components: sccList,
            compWithLeastVertex: compWithLeastVertex,
            leastVertexInAComp: leastVertexInAComponentSoFar
           };
}