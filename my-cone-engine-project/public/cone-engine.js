class Component {}

class Transform extends Component {
    constructor(x = 100, y = 100) {
        super();
        this.x = x;
        this.y = y;
    }
}

class ScriptComponent extends Component {
    constructor(scope) {
        super();
        this.scope = scope;
    }
}

class Entity {
    constructor(name) {
        this.name = name;
        this.components = new Map();
    }
    addComponent(c) { this.components.set(c.constructor, c); }
    getComponent(cls) { return this.components.get(cls); }
}

class ConeEngine {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.entities = [];
        this.keys = {};

        window.addEventListener('keydown', e => this.keys[e.code] = true);
        window.addEventListener('keyup', e => this.keys[e.code] = false);
    }

    print(msg) { console.log(`[Double C*]: ${msg}`); }

    move(entity, dx, dy) {
        const t = entity.getComponent(Transform);
        if (t) {
            t.x += dx;
            t.y += dy;
        }
    }

    addEntity(e) { this.entities.push(e); }

    start() {
        const loop = () => {
            this.update();
            this.render();
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    update() {
        this.entities.forEach(e => {
            const s = e.getComponent(ScriptComponent);
            if (s && s.scope.on_update) {
                s.scope.on_update(e, this.keys);
            }
        });
    }

    render() {
        this.ctx.fillStyle = "#1e1e23";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.entities.forEach(e => {
            const t = e.getComponent(Transform);
            if (t) {
                this.ctx.fillStyle = "#00c8ff";
                this.ctx.fillRect(t.x, t.y, 40, 40);

                this.ctx.fillStyle = "#ffffff";
                this.ctx.font = "14px monospace";
                this.ctx.fillText(e.name, t.x, t.y - 8);
            }
        });
    }
}
