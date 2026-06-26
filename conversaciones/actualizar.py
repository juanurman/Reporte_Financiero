import os
import json
import re
import sys

# Ensure UTF-8 output
sys.stdout.reconfigure(encoding='utf-8')

# Mapping of conversation IDs to their names in this project
CONVERSATIONS_MAP = {
    "7b30c7a1-fb67-47b5-a7ea-485103ed5abd": "codigo.md",
    "ef1617f1-dfdf-498d-94ba-33724defa041": "diseno.md",
    "d414aae5-8e1e-4d68-a4b5-4129a42ce8ad": "modelo_negocio.md",
    "5eeeb489-eebb-4e29-9ac6-04cb8cfd7a94": "principal.md" # Current conversation
}

def clean_content(content):
    if not content:
        return ""
    content = re.sub(r'<USER_REQUEST>\s*', '', content)
    content = re.sub(r'\s*</USER_REQUEST>', '', content)
    content = re.sub(r'<ADDITIONAL_METADATA>.*?</ADDITIONAL_METADATA>', '', content, flags=re.DOTALL)
    content = re.sub(r'<USER_SETTINGS_CHANGE>.*?</USER_SETTINGS_CHANGE>', '', content, flags=re.DOTALL)
    return content.strip()

def update_all_exports():
    app_data_dir = r"C:\Users\juanu\.gemini\antigravity"
    current_dir = os.path.dirname(os.path.abspath(__file__))
    
    print("🔄 Iniciando actualización de conversaciones del proyecto...")
    
    for conv_id, filename in CONVERSATIONS_MAP.items():
        log_path = os.path.join(app_data_dir, "brain", conv_id, ".system_generated", "logs", "transcript_full.jsonl")
        if not os.path.exists(log_path):
            log_path = os.path.join(app_data_dir, "brain", conv_id, ".system_generated", "logs", "transcript.jsonl")
            
        if not os.path.exists(log_path):
            print(f"⚠️ No se encontró la base de datos de logs para {filename} ({conv_id})")
            continue
            
        markdown_lines = [
            f"# Historial: {filename.replace('.md', '').upper()}\n",
            f"ID de Conversación: `{conv_id}`  \n",
            "Actualizado automáticamente.  \n",
            "---\n"
        ]
        
        with open(log_path, 'r', encoding='utf-8') as f:
            for line in f:
                try:
                    step = json.loads(line.strip())
                    source = step.get("source")
                    step_type = step.get("type")
                    content = step.get("content", "")
                    
                    if step_type == "USER_INPUT" and source == "USER_EXPLICIT":
                        cleaned = clean_content(content)
                        markdown_lines.append(f"## 👤 Usuario\n\n{cleaned}\n\n---\n")
                    elif step_type == "PLANNER_RESPONSE" and source == "MODEL":
                        cleaned = clean_content(content)
                        if cleaned:
                            markdown_lines.append(f"## 🤖 Antigravity\n\n{cleaned}\n\n---\n")
                    elif step_type == "GENERIC" and source == "MODEL":
                        cleaned = clean_content(content)
                        if cleaned and not cleaned.startswith("Created At:") and not cleaned.startswith("Completed At:"):
                            markdown_lines.append(f"{cleaned}\n\n")
                except:
                    continue
                    
        output_file = os.path.join(current_dir, filename)
        with open(output_file, 'w', encoding='utf-8') as out_f:
            out_f.write("\n".join(markdown_lines))
            
        print(f"✅ {filename} actualizado.")

if __name__ == "__main__":
    update_all_exports()
