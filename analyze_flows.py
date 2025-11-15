#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Analyze Node-RED flows.json and extract all components, functions, and logic
"""

import json
import sys

def analyze_flows(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Organize nodes by type
    nodes_by_type = {}
    for node in data:
        node_type = node.get('type', 'unknown')
        if node_type not in nodes_by_type:
            nodes_by_type[node_type] = []
        nodes_by_type[node_type].append(node)

    # Print statistics
    print("# Node-RED Flow 完整功能分析報告\n")
    print("## 1. 應用架構概覽\n")
    print(f"- **總節點數量**: {len(data)}")
    print(f"- **節點類型數量**: {len(nodes_by_type)}")
    print(f"- **頁面數量**: {len(nodes_by_type.get('ui-page', []))}")
    print(f"- **Function 節點數量**: {len(nodes_by_type.get('function', []))}")
    print()

    # Extract pages
    print("### 頁面清單\n")
    pages = nodes_by_type.get('ui-page', [])
    page_map = {}
    for p in pages:
        page_map[p['id']] = p
        print(f"- **{p.get('name')}**")
        print(f"  - 路徑: `{p.get('path')}`")
        print(f"  - 圖標: `{p.get('icon')}`")
        print(f"  - ID: `{p.get('id')}`")
        print()

    # Extract groups
    print("### UI 群組清單\n")
    groups = nodes_by_type.get('ui-group', [])
    group_map = {}
    for g in groups:
        group_map[g['id']] = g
        page = page_map.get(g.get('page'), {})
        print(f"- **{g.get('name')}** (屬於頁面: {page.get('name', 'Unknown')})")
        print(f"  - 寬度: {g.get('width')} | 高度: {g.get('height')}")
        print(f"  - ID: `{g.get('id')}`")
        print()

    # Extract UI components
    print("\n## 2. UI 組件分析\n")
    ui_types = ['ui-template', 'ui-chart', 'ui-iframe', 'worldmap']
    for ui_type in ui_types:
        components = nodes_by_type.get(ui_type, [])
        if components:
            print(f"### {ui_type} ({len(components)} 個)\n")
            for comp in components:
                group = group_map.get(comp.get('group'), {})
                page = page_map.get(group.get('page'), {})
                print(f"- **{comp.get('name', 'Unnamed')}**")
                print(f"  - 頁面: {page.get('name', 'Unknown')}")
                print(f"  - 群組: {group.get('name', 'Unknown')}")
                if ui_type == 'ui-template':
                    template = comp.get('templateScope', 'local')
                    print(f"  - Scope: {template}")
                elif ui_type == 'ui-chart':
                    chart_type = comp.get('chartType', 'line')
                    print(f"  - 圖表類型: {chart_type}")
                print()

    # Extract MQTT configs
    print("\n## 3. MQTT 配置\n")
    mqtt_brokers = nodes_by_type.get('mqtt-broker', [])
    for broker in mqtt_brokers:
        print(f"- **Broker**: {broker.get('name', 'Unnamed')}")
        print(f"  - Host: {broker.get('broker')}")
        print(f"  - Port: {broker.get('port')}")
        print(f"  - Client ID: {broker.get('clientid')}")
        print()

    mqtt_in = nodes_by_type.get('mqtt in', [])
    print(f"### MQTT In 節點 ({len(mqtt_in)} 個)\n")
    for node in mqtt_in:
        print(f"- **{node.get('name', 'Unnamed')}**")
        print(f"  - Topic: `{node.get('topic')}`")
        print(f"  - QoS: {node.get('qos', 0)}")
        print()

    mqtt_out = nodes_by_type.get('mqtt out', [])
    print(f"### MQTT Out 節點 ({len(mqtt_out)} 個)\n")
    for node in mqtt_out:
        print(f"- **{node.get('name', 'Unnamed')}**")
        print(f"  - Topic: `{node.get('topic')}`")
        print(f"  - QoS: {node.get('qos', 0)}")
        print()

    # Extract HTTP endpoints
    print("\n## 4. HTTP API 端點\n")
    http_in = nodes_by_type.get('http in', [])
    for node in http_in:
        print(f"- **{node.get('method', 'GET').upper()} {node.get('url')}**")
        print(f"  - Name: {node.get('name', 'Unnamed')}")
        print()

    # Extract database config
    print("\n## 5. PostgreSQL 配置\n")
    pg_configs = nodes_by_type.get('postgreSQLConfig', [])
    for config in pg_configs:
        print(f"- **Database**: {config.get('name', 'Unnamed')}")
        print(f"  - Host: {config.get('host')}")
        print(f"  - Port: {config.get('port')}")
        print(f"  - Database: {config.get('database')}")
        print(f"  - SSL: {config.get('ssl', False)}")
        print()

    # Extract function nodes with code
    print("\n## 6. 關鍵 Function 節點程式碼\n")
    functions = nodes_by_type.get('function', [])

    # Group functions by category
    data_processing = []
    sql_generators = []
    ui_formatting = []
    auth = []
    config_sync = []
    other = []

    for func in functions:
        name = func.get('name', 'Unnamed')
        if 'SQL' in name or 'sql' in name.lower():
            sql_generators.append(func)
        elif '解析' in name or 'parse' in name.lower():
            data_processing.append(func)
        elif '格式' in name or 'format' in name.lower():
            ui_formatting.append(func)
        elif '登入' in name or 'login' in name.lower() or '密碼' in name:
            auth.append(func)
        elif '設定' in name or 'config' in name.lower() or '配置' in name:
            config_sync.append(func)
        elif 'manifest' in name.lower() or 'icon' in name.lower() or 'logo' in name.lower():
            other.append(func)
        else:
            other.append(func)

    # Print categorized functions
    categories = [
        ("認證與授權", auth),
        ("數據解析器", data_processing),
        ("SQL 生成器", sql_generators),
        ("UI 格式化", ui_formatting),
        ("配置同步", config_sync),
        ("其他功能", other)
    ]

    for category_name, category_funcs in categories:
        if category_funcs:
            print(f"### {category_name} ({len(category_funcs)} 個)\n")
            for func in category_funcs:
                name = func.get('name', 'Unnamed')
                func_code = func.get('func', '')
                outputs = func.get('outputs', 1)

                print(f"#### {name}\n")
                print(f"- **ID**: `{func.get('id')}`")
                print(f"- **Outputs**: {outputs}")
                print(f"- **程式碼**:\n")
                print("```javascript")
                print(func_code)
                print("```\n")

    # Extract UI theme
    print("\n## 7. UI 主題配置\n")
    themes = nodes_by_type.get('ui-theme', [])
    for theme in themes:
        print(f"- **Theme**: {theme.get('name', 'Unnamed')}")
        colors = theme.get('colors', {})
        if colors:
            print(f"  - Primary: `{colors.get('primary', 'N/A')}`")
            print(f"  - Background: `{colors.get('bg', 'N/A')}`")
            print(f"  - Background Page: `{colors.get('bgPage', 'N/A')}`")
        print()

    # Extract UI base
    print("\n## 8. UI Base 配置\n")
    ui_base = nodes_by_type.get('ui-base', [])
    for base in ui_base:
        print(f"- **Path**: `{base.get('path', '/')}`")
        print(f"- **Title**: {base.get('title', 'Dashboard')}")
        print()

if __name__ == '__main__':
    import sys
    import io

    # Force UTF-8 encoding for stdout
    if sys.stdout.encoding != 'utf-8':
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

    analyze_flows('flows.json')
