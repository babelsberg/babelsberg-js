function colorizeMap(states, colors) {
    if (!assignColors(pairCandidates(states, colors))) {
        throw "could not find a solution";
    }
}

function pairCandidates(states, colors) {
    return states.map(s => [s, colors.slice()]);
}

function assignColors(candidates, stateIndex) {
    stateIndex = stateIndex || 0;
    if (stateIndex >= candidates.length) {
        return true;
    }
    var [state, colors] = candidates[stateIndex],
        neighbors = neighborsIn(state, candidates);

    for (let color of colors) {
        var neighborColors = [];
        for (let neighborPair of neighbors) {
            var s = neighborPair[0],
                c = neighborPair[1];
            if (s.color == color) {
                continue;
            }
            neighborColors.push(c.slice());
            if (c.indexOf(color) >= 0) {
                if (c.length == 1) {
                    continue; // cannot remove the last candidate
                }
                c.splice(c.indexOf(color), 1);
            }
            neighborPair[1] = c;
        }
        state.color = color;
        if (assignColors(candidates, stateIndex + 1)) {
            return true;
        }
        neighbors.forEach((pair, index) => {
            pair[1] = neighborColors[index];
        });
    }
    return false;

    function neighborsIn(state, candidates) {
        return candidates.select(([s, c]) => s.neighborOf(state) && s !== state);
    }
}
