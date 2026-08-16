class DoubleCCompiler {
    static compile(scriptText) {
        let jsLines = ["const scope = {};"];

        // Parse variables: var speed = 6
        const varMatches = [...scriptText.matchAll(/var\s+(\w+)\s*=\s*(\d+)/g)];
        varMatches.forEach(([, name, value]) => {
            jsLines.push(`scope.${name} = ${value};`);
        });

        // Parse 'on start'
        const startMatch = scriptText.match(/on\s+start\s*\{([^}]+)\}/);
        if (startMatch) {
            jsLines.push("scope.on_start = function() {");
            startMatch[1].trim().split('\n').forEach(line => {
                if (line.trim()) jsLines.push(`    ${this.parseLine(line.trim())}`);
            });
            jsLines.push("};");
        }

        // Parse 'on update'
        const updateMatch = scriptText.match(/on\s+update\s*\{([^}]+)\}/);
        if (updateMatch) {
            jsLines.push("scope.on_update = function(entity, keys) {");
            updateMatch[1].trim().split('\n').forEach(line => {
                if (line.trim()) jsLines.push(`    ${this.parseLine(line.trim())}`);
            });
            jsLines.push("};");
        }

        jsLines.push("return scope;");
        return new Function('engine', 'entity', jsLines.join('\n'));
    }

    static parseLine(line) {
        line = line.replace(/print\s+"(.*)"/, 'engine.print("$1")');
        line = line.replace(/OpenWebsite\("(.*?)"\)/, 'window.open("$1", "_blank")');
        line = line.replace(/move\((.*?),\s*(.*?)\)/, 'engine.move(entity, $1, $2)');

        const keyMatch = line.match(/if\s+key\s+(\w+)\s*\{\s*(.*?)\s*\}/);
        if (keyMatch) {
            const [, key, action] = keyMatch;
            return `if (keys['Key${key.toUpperCase()}'] || keys['Key${key.toLowerCase()}']) { ${this.parseLine(action)} }`;
        }
        return line;
    }
}
