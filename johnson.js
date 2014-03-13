var adjacencyStructure = function(cc) {
    // Parameter G: a connected componenent (array of arrays from the tarjan() function)
    // Returns an object A of adjacency lists.
    // The first n-1 elements of A will be empty if G is a subgraph.
    
    var A = {},
        vertex_ids = [];
    
    for(var i=0; i<cc.length; i++) {
        vertex_ids.push(+cc[i].id);
    }

    for(var i=0; i<cc.length; i++) {
        v_id = vertex_ids[i];
        A[v_id] = [];
        for (var j=0,last=cc[i].matches.length; j<last; j++) {
            recipient = cc[i].matches[j].recipient;
            if (vertex_ids.indexOf(recipient) != -1) {  // if recipient vertex is in the graph
                A[v_id].push(recipient);
            }
        }
    }

    return A;
}


var johnson = function(G) {

    var A_K,       // an object of arrays
        B = {},    // B will be an object of arrays
        blocked = [],
        stack = [],
        s = 1,
        circuits = [];   // The function's return value
        
    var circuit = function(v) {
        var unblock = function(u) {
            blocked[u] = false;
            for (var i=0,last=B[u].length; i<last; i++) {
                w = B[u][i];
                console.log("w " + w)
                console.log("B[u] before " + JSON.stringify(B[u]))
                B[u].splice(i, 1); // delete w from B[u]
                console.log("B[u] after " + JSON.stringify(B[u]))
                if (blocked[w]) { unblock(w); }
            }
        }
        var f = false;
        stack.push(v);
        blocked[v] = true;
        
        console.log("A_K");
        console.log(A_K);
               
        A_K[v].forEach(function(w) {
            if (w==s) {
                circuitOut = stack.slice(0);  // copy stack
                circuitOut.push(s);
                circuits.push(circuitOut);
                f = true;
            } else if (!blocked[w] && circuit(w)) {
                f = true;
            }
        });
        if (f) {
            unblock(v);
        } else {
            A_K[v].forEach(function(w) {
                console.log("B[w]");
                console.log(JSON.stringify(B[w]));
                if (B[w].indexOf(v) == -1) {
                    B[w].push(v);
                }
            });
        }
        
        // UNSTACK V
        testVar = stack.pop();
        if (testVar != v) {alert("check unstack v");}

        return f;
    }
    
    var n = 0;   // number of vertices
    for (v_id in G) {
        if (G.hasOwnProperty(v_id)) {
            n += 1;
        } else {
            alert("The graph object has inherited properties. The algorithm may not work correctly");
        }
    }
    
    while (s < n) {
        //var subgraph_s = subgraph(G, s);
        var cc = tarjan(subgraph(G, s));
        
        
        
        /*console.log("G2 :-)")
        console.log(G);
        console.log("subgraph...")
        console.log(s);
        console.log(subgraph(G, s));*/
        console.log("cc")
        console.log(JSON.stringify(cc, undefined,2));
              
        if (cc.compWithLeastVertex != null) {
            var smallestCC = cc.components[cc.compWithLeastVertex];
            A_K = adjacencyStructure(smallestCC);
        console.log("   A_K");
        console.log(A_K);


            s = cc.leastVertexInAComp;
            for (v_id in A_K) {
                blocked[+v_id] = false;
                B[v_id] = [];
            }
            //console.log(s);
            
            circuit(s);
            s += 1;
        } else {
            s = n;
        }
    }
    
    console.log(JSON.stringify(circuits));
    return circuits;
}