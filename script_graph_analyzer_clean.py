#!/usr/bin/env python3
"""
Galaxy Trucker Script Graph Analyzer
Analizza tutti gli script nelle cartelle campaignScriptsEN per creare un grafo delle dipendenze
"""

import os
import re
import json
from pathlib import Path
from typing import Dict, List, Set, Tuple
from collections import defaultdict

class ScriptGraphAnalyzer:
    def __init__(self, base_path: str):
        self.base_path = Path(base_path)
        self.scripts: Dict[str, str] = {}  # script_name -> file_path
        self.missions: Dict[str, str] = {}  # mission_name -> file_path
        self.dependencies: Dict[str, Set[str]] = defaultdict(set)  # from -> {to1, to2, ...}
        self.script_types: Dict[str, str] = {}  # name -> type (script/mission)
        
    def analyze_all(self):
        """Analizza tutti i file e crea il grafo delle dipendenze"""
        print("Inizio analisi script Galaxy Trucker...")
        
        # Step 1: Trova tutti gli script e missioni
        self._find_all_files()
        
        # Step 2: Analizza le dipendenze
        self._analyze_dependencies()
        
        # Step 3: Genera il grafo
        return self._generate_graph()
    
    def _find_all_files(self):
        """Trova tutti i file script e missioni"""
        campaign_dir = self.base_path / "server" / "GAMEFOLDER" / "campaign" / "campaignScriptsEN"
        
        if not campaign_dir.exists():
            print(f"Directory non trovata: {campaign_dir}")
            return
            
        print(f"Scansiono: {campaign_dir}")
        
        # Trova tutti i file .txt
        script_files = list(campaign_dir.glob("*.txt"))
        yaml_files = list(campaign_dir.glob("*.yaml"))
        
        print(f"Trovati {len(script_files)} file script e {len(yaml_files)} file YAML")
        
        for file_path in script_files:
            print(f"   Script: {file_path.name}")
            self._parse_script_file(file_path)
            
        for file_path in yaml_files:
            print(f"   YAML: {file_path.name}")
            self._parse_yaml_file(file_path)
    
    def _parse_script_file(self, file_path: Path):
        """Analizza un file script per trovare definizioni SCRIPT"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Cerca definizioni SCRIPT
            script_pattern = r'^SCRIPT\s+(\w+)'
            matches = re.findall(script_pattern, content, re.MULTILINE)
            
            for script_name in matches:
                self.scripts[script_name] = str(file_path)
                self.script_types[script_name] = 'script'
                print(f"     Script trovato: {script_name}")
                
        except Exception as e:
            print(f"Errore leggendo {file_path}: {e}")
    
    def _parse_yaml_file(self, file_path: Path):
        """Analizza un file YAML per trovare definizioni di missioni"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Cerca definizioni di missioni (formato YAML)
            # Assumiamo che le missioni siano definite come chiavi al primo livello
            mission_pattern = r'^(\w+):\s*$'
            matches = re.findall(mission_pattern, content, re.MULTILINE)
            
            for mission_name in matches:
                # Escludi chiavi comuni di configurazione
                if mission_name not in ['missions', 'default', 'common', 'settings']:
                    self.missions[mission_name] = str(file_path)
                    self.script_types[mission_name] = 'mission'
                    print(f"     Mission trovata: {mission_name}")
                    
        except Exception as e:
            print(f"Errore leggendo {file_path}: {e}")
    
    def _analyze_dependencies(self):
        """Analizza le dipendenze tra script"""
        print("\nAnalisi dipendenze...")
        
        # Analizza ogni file script per trovare chiamate
        campaign_dir = self.base_path / "server" / "GAMEFOLDER" / "campaign" / "campaignScriptsEN"
        
        for script_file in campaign_dir.glob("*.txt"):
            self._analyze_script_dependencies(script_file)
    
    def _analyze_script_dependencies(self, file_path: Path):
        """Analizza le dipendenze in un singolo file script"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            current_script = None
            
            # Splitta il contenuto in linee per analisi riga per riga
            lines = content.split('\n')
            
            for line in lines:
                line = line.strip()
                
                # Identifica lo script corrente
                script_match = re.match(r'^SCRIPT\s+(\w+)', line)
                if script_match:
                    current_script = script_match.group(1)
                    continue
                
                if not current_script:
                    continue
                
                # Cerca chiamate GO
                go_match = re.search(r'\bGO\s+(\w+)', line)
                if go_match:
                    target = go_match.group(1)
                    self.dependencies[current_script].add(target)
                    print(f"     GO: {current_script} -> {target}")
                
                # Cerca chiamate SUB_SCRIPT
                sub_match = re.search(r'\bSUB_SCRIPT\s+(\w+)', line)
                if sub_match:
                    target = sub_match.group(1)
                    self.dependencies[current_script].add(target)
                    print(f"     SUB_SCRIPT: {current_script} -> {target}")
                
                # Cerca chiamate LAUNCH_MISSION
                mission_match = re.search(r'\bLAUNCH_MISSION\s+["\']?(\w+)["\']?', line)
                if mission_match:
                    target = mission_match.group(1)
                    self.dependencies[current_script].add(target)
                    print(f"     LAUNCH_MISSION: {current_script} -> {target}")
                
        except Exception as e:
            print(f"Errore analizzando dipendenze in {file_path}: {e}")
    
    def _generate_graph(self) -> Dict:
        """Genera la struttura del grafo"""
        print("\nGenerazione grafo...")
        
        nodes = []
        edges = []
        
        # Aggiungi tutti i nodi (script + missioni)
        all_items = {**self.scripts, **self.missions}
        
        for name, file_path in all_items.items():
            node_type = self.script_types.get(name, 'unknown')
            
            nodes.append({
                'id': name,
                'label': name,
                'type': node_type,
                'file': file_path,
                'group': node_type
            })
        
        # Aggiungi tutti gli archi
        for source, targets in self.dependencies.items():
            for target in targets:
                edges.append({
                    'from': source,
                    'to': target,
                    'arrows': 'to'
                })
        
        # Crea la struttura finale del grafo
        graph = {
            'nodes': nodes,
            'edges': edges,
            'metadata': {
                'total_scripts': len(self.scripts),
                'total_missions': len(self.missions),
                'total_dependencies': sum(len(deps) for deps in self.dependencies.values()),
                'generated_by': 'Galaxy Trucker Script Graph Analyzer'
            }
        }
        
        print(f"Grafo generato:")
        print(f"   {len(self.scripts)} script")
        print(f"   {len(self.missions)} missioni")
        print(f"   {sum(len(deps) for deps in self.dependencies.values())} dipendenze")
        
        return graph

def main():
    """Funzione principale"""
    base_path = Path(__file__).parent
    analyzer = ScriptGraphAnalyzer(base_path)
    
    # Genera il grafo
    graph_data = analyzer.analyze_all()
    
    # Salva il grafo in formato JSON
    output_file = base_path / "galaxy_trucker_script_graph.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(graph_data, f, indent=2, ensure_ascii=False)
    
    print(f"\nGrafo salvato in: {output_file}")
    
    # Genera anche un file HTML per visualizzazione
    html_content = generate_html_visualization(graph_data)
    html_file = base_path / "galaxy_trucker_script_graph.html"
    
    with open(html_file, 'w', encoding='utf-8') as f:
        f.write(html_content)
    
    print(f"Visualizzazione HTML salvata in: {html_file}")
    print("\nAnalisi completata! Apri il file HTML per visualizzare il grafo.")

def generate_html_visualization(graph_data: Dict) -> str:
    """Genera una pagina HTML per visualizzare il grafo con vis.js"""
    
    nodes_json = json.dumps(graph_data['nodes'], indent=2)
    edges_json = json.dumps(graph_data['edges'], indent=2)
    
    html_template = f"""
<!DOCTYPE html>
<html>
<head>
    <title>Galaxy Trucker Script Graph</title>
    <script type="text/javascript" src="https://unpkg.com/vis-network/standalone/umd/vis-network.min.js"></script>
    <style>
        body {{
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background-color: #1a1a1a;
            color: white;
        }}
        
        #mynetworkid {{
            width: 100%;
            height: 800px;
            border: 1px solid #444;
            background-color: #2a2a2a;
        }}
        
        .info {{
            margin-bottom: 20px;
            padding: 15px;
            background-color: #333;
            border-radius: 5px;
        }}
        
        .stats {{
            display: flex;
            gap: 20px;
            margin-bottom: 20px;
        }}
        
        .stat {{
            background-color: #444;
            padding: 10px;
            border-radius: 5px;
            text-align: center;
            flex: 1;
        }}
        
        .stat-number {{
            font-size: 24px;
            font-weight: bold;
            color: #ffa500;
        }}
        
        .legend {{
            position: absolute;
            top: 20px;
            right: 20px;
            background-color: rgba(51, 51, 51, 0.9);
            padding: 15px;
            border-radius: 5px;
            border: 1px solid #666;
        }}
        
        .legend-item {{
            display: flex;
            align-items: center;
            margin-bottom: 5px;
        }}
        
        .legend-color {{
            width: 15px;
            height: 15px;
            border-radius: 50%;
            margin-right: 10px;
        }}
        
        .controls {{
            margin-bottom: 20px;
            padding: 15px;
            background-color: #333;
            border-radius: 5px;
        }}
        
        button {{
            background-color: #555;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            margin-right: 10px;
            cursor: pointer;
        }}
        
        button:hover {{
            background-color: #666;
        }}
    </style>
</head>
<body>
    <h1>Galaxy Trucker Script Dependencies Graph</h1>
    
    <div class="info">
        <p>Grafo delle dipendenze tra script e missioni di Galaxy Trucker. I nodi rappresentano script e missioni, mentre gli archi mostrano le chiamate tra di essi.</p>
    </div>
    
    <div class="stats">
        <div class="stat">
            <div class="stat-number">{graph_data['metadata']['total_scripts']}</div>
            <div>Script</div>
        </div>
        <div class="stat">
            <div class="stat-number">{graph_data['metadata']['total_missions']}</div>
            <div>Missioni</div>
        </div>
        <div class="stat">
            <div class="stat-number">{graph_data['metadata']['total_dependencies']}</div>
            <div>Dipendenze</div>
        </div>
    </div>
    
    <div class="controls">
        <button onclick="fitNetwork()">Centra Grafo</button>
        <button onclick="togglePhysics()">Toggle Fisica</button>
        <button onclick="exportGraph()">Esporta PNG</button>
    </div>
    
    <div id="mynetworkid"></div>
    
    <div class="legend">
        <h4>Legenda</h4>
        <div class="legend-item">
            <div class="legend-color" style="background-color: #ff6b6b;"></div>
            Script
        </div>
        <div class="legend-item">
            <div class="legend-color" style="background-color: #4ecdc4;"></div>
            Missioni
        </div>
    </div>

    <script type="text/javascript">
        // Dati del grafo
        var nodes = new vis.DataSet({nodes_json});
        var edges = new vis.DataSet({edges_json});
        
        // Configura i colori per tipo
        nodes.forEach(function(node) {{
            if (node.type === 'script') {{
                node.color = {{
                    background: '#ff6b6b',
                    border: '#ff5252',
                    highlight: {{
                        background: '#ff8a80',
                        border: '#ff5252'
                    }}
                }};
                node.shape = 'circle';
            }} else if (node.type === 'mission') {{
                node.color = {{
                    background: '#4ecdc4',
                    border: '#26a69a',
                    highlight: {{
                        background: '#80cbc4',
                        border: '#26a69a'
                    }}
                }};
                node.shape = 'square';
            }} else {{
                node.color = {{
                    background: '#ffa726',
                    border: '#ff9800'
                }};
                node.shape = 'triangle';
            }}
            
            // Imposta la dimensione in base al numero di connessioni
            var connections = edges.get({{
                filter: function(item) {{
                    return item.from === node.id || item.to === node.id;
                }}
            }}).length;
            node.size = Math.max(15, Math.min(50, 15 + connections * 3));
        }});
        
        // Crea il network
        var container = document.getElementById('mynetworkid');
        var data = {{
            nodes: nodes,
            edges: edges
        }};
        
        var options = {{
            layout: {{
                improvedLayout: true,
                hierarchical: {{
                    enabled: false
                }}
            }},
            physics: {{
                enabled: true,
                stabilization: {{
                    iterations: 200
                }},
                barnesHut: {{
                    gravitationalConstant: -8000,
                    centralGravity: 0.3,
                    springLength: 150,
                    springConstant: 0.04,
                    damping: 0.09
                }}
            }},
            nodes: {{
                borderWidth: 2,
                shadow: true,
                font: {{
                    size: 14,
                    color: '#ffffff'
                }}
            }},
            edges: {{
                width: 2,
                color: {{
                    color: '#848484',
                    highlight: '#ffa500'
                }},
                arrows: {{
                    to: {{
                        enabled: true,
                        scaleFactor: 1,
                        type: 'arrow'
                    }}
                }},
                smooth: {{
                    type: 'continuous'
                }}
            }},
            interaction: {{
                hover: true,
                tooltipDelay: 200
            }}
        }};
        
        var network = new vis.Network(container, data, options);
        var physicsEnabled = true;
        
        // Funzioni di controllo
        function fitNetwork() {{
            network.fit();
        }}
        
        function togglePhysics() {{
            physicsEnabled = !physicsEnabled;
            network.setOptions({{physics: physicsEnabled}});
        }}
        
        function exportGraph() {{
            // Funzione per esportare come immagine (richiede canvas)
            alert("Usa il tasto destro del mouse sul grafo e seleziona 'Salva immagine come...'");
        }}
        
        // Aggiungi tooltip
        network.on("hoverNode", function (params) {{
            var nodeId = params.node;
            var node = nodes.get(nodeId);
            
            var tooltip = "Tipo: " + node.type + "\\n";
            tooltip += "File: " + node.file;
            
            // Mostra tooltip
            container.title = tooltip;
        }});
        
        // Centra il grafo quando è caricato
        network.on("stabilizationIterationsDone", function () {{
            network.fit();
        }});
        
        // Log informazioni
        console.log("Grafo Galaxy Trucker caricato con successo!");
        console.log("Usa il mouse per navigare: drag per muovere, scroll per zoom, click per selezionare");
        console.log("Nodi:", nodes.length);
        console.log("Archi:", edges.length);
    </script>
</body>
</html>
"""
    
    return html_template

if __name__ == "__main__":
    main()