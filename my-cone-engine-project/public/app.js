import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCzsTF-kiR_jCOJMLfonV6BNemreeT7v-g",
  authDomain: "cone-engine.firebaseapp.com",
  projectId: "cone-engine",
  storageBucket: "cone-engine.firebasestorage.app",
  messagingSenderId: "733009087130",
  appId: "1:733009087130:web:a097a8ab7285a2058bed23"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let activeEngine = null;

window.switchTab = function(tabName) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.getElementById(`tab-${tabName}`).classList.add('active');
    if (tabName === 'play') loadCommunityGames();
};

window.runScript = function() {
    if (activeEngine) activeEngine.stop();
    
    activeEngine = new ConeEngine('gameCanvas');
    const rawCode = document.getElementById('code-editor').value;
    
    const compiledFn = DoubleCCompiler.compile(rawCode);
    const player = new Entity("Player");
    
    const scriptScope = compiledFn(activeEngine, player);
    player.addComponent(new Transform(200, 180));
    player.addComponent(new ScriptComponent(scriptScope));

    if (scriptScope.on_start) scriptScope.on_start();
    
    activeEngine.addEntity(player);
    activeEngine.start();
};

window.publishGame = async function() {
    const title = prompt("Enter Game Title:");
    const code = document.getElementById('code-editor').value;
    
    if (!title) return;

    await addDoc(collection(db, "games"), {
        title: title,
        script: code,
        createdAt: new Date()
    });
    alert("Game published to community feed!");
    switchTab('play');
};

async function loadCommunityGames() {
    const grid = document.getElementById('game-grid');
    grid.innerHTML = "";
    
    const querySnapshot = await getDocs(collection(db, "games"));
    querySnapshot.forEach((doc) => {
        const data = doc.data();
        const card = document.createElement('div');
        card.className = "game-card";
        card.innerHTML = `<h4>${data.title}</h4><button onclick="playCommunityGame(\`${encodeURIComponent(data.script)}\`)">Play</button>`;
        grid.appendChild(card);
    });
}

window.playCommunityGame = function(encodedScript) {
    const script = decodeURIComponent(encodedScript);
    document.getElementById('code-editor').value = script;
    switchTab('create');
    runScript();
};
