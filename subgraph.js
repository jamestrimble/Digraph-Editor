var subgraph = function(G, minId) {
    var subG = {};
    
    for(v_id in G) {
        if (+v_id >= minId) {
            subG[v_id] = {};   //splice(G[v_id], 0);  // Copy object
            //console.log(G[v_id]);
            if (G[v_id].hasOwnProperty('matches')) {
                subG[v_id].matches = G[v_id].matches.filter(function(x) {
                    return x.recipient >= minId;
                });
            } else {
                subG[v_id].matches = [];
            }
        }
    }
    
    //console.log(JSON.stringify(subG));
    return subG;

}