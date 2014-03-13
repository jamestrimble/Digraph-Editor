var subgraph = function(G, minId) {
    var subG = {};
    
    for(v_id in G) {
        if (+v_id >= minId) {
            subG[v_id] = {};
            if (G[v_id].hasOwnProperty('matches')) {
                subG[v_id].matches = G[v_id].matches.filter(function(x) {
                    return x.recipient >= minId;
                });
            } else {
                subG[v_id].matches = [];
            }
        }
    }
    
    return subG;

}