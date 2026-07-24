# -*- coding: utf-8 -*-
import os
import csv
import json
import re
import zipfile
import urllib.request
import gzip
from io import BytesIO

# Lista rigorosa de termos proibidos (Politica da Shopee)
FORBIDDEN_KEYWORDS = [
    # Promessas milagrosas e saude
    r"emagrecedor", r"emagrecer", r"perda de peso", r"secador de barriga", r"dieta milagrosa",
    r"rejuvenescimento", r"oculos de grau", r"oculos multifocal", r"grau multifocal",
    r"suplemento alimentar", r"termogenico", r"inibidor de apetite", r"colageno hidrolisado",
    # Produtos medicos e remedios
    r"medico", r"remedio", r"farmacia", r"medicamento", r"vitamina c", r"vitamina d",
    r"suplemento", r"saude", r"hiv", r"covid", r"lente de contato", r"aparelho auditivo",
    r"vacina", r"termometro corporal", r"glicose", r"glicosimetro", r"preservativo",
    r"mascara cirurgica", r"seringa", r"agulha", r"colirio", r"pomada cicatrizante",
    # Cosmeticos sem registro ou invasivos
    r"injetavel", r"acido hialuronico", r"botox", r"peeling", r"cosmetico usado",
    r"fracionado", r"amostra gratis", r"pigmento micro", r"microagulhamento",
    # Produtos digitais, servicos e apostas
    r"curso", r"e-book", r"ebook", r"pdf", r"rifa", r"aposta", r"bet", r"casino",
    r"cassino", r"servico", r"mystery box", r"caixa surpresa", r"ingresso", r"licenca",
    r"assinatura", r"ativação", r"chave digital", r"gift card", r"cartao presente",
    # Armas, perigosos e cigarros
    r"arma", r"pistola", r"revolver", r"rifle", r"fuzil", r"balas", r"municao",
    r"bomba", r"explosivo", r"faca tatica", r"canivete", r"espada", r"brinquedo de arma",
    r"airsoft", r"chumbinho", r"cigarro", r"vape", r"vaper", r"pod", r"essencia vape",
    r"narguile", r"tabaco", r"inflamavel", r"isqueiro maçarico", r"taser", r"spray de pimenta",
    # Falsificacoes, espionagem e roubo de sinal
    r"replica", r"falso", r"copia", r"pirata", r"espionagem", r"camera espia",
    r"rastreador espiao", r"bloqueador de sinal", r"jammer", r"gato net", r"iptv",
    r"desbloqueador de tv", r"aparelho receptor", r"tv box desbloqueada", r"sky gato"
]

FORBIDDEN_REGEX = re.compile("|".join(FORBIDDEN_KEYWORDS), re.IGNORECASE)

def is_compliant(product_name, category_name=""):
    """
    Verifica se o produto esta em conformidade com as regras da Shopee.
    Retorna True se estiver limpo, False se violar alguma regra.
    """
    if FORBIDDEN_REGEX.search(product_name):
        return False
    if category_name and FORBIDDEN_REGEX.search(category_name):
        return False
    return True

def download_datafeed(url):
    """
    Faz o download do datafeed a partir da URL fornecida.
    Suporta arquivos compactados (ZIP, GZ) ou CSV direto.
    Usa timeout para evitar travamentos.
    """
    print(f"Iniciando download do Datafeed a partir de: {url[:60]}...")
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    req = urllib.request.Request(url, headers=headers)
    
    try:
        with urllib.request.urlopen(req, timeout=8) as response:
            content = response.read()
            print("Download concluido com sucesso! Tamanho:", len(content), "bytes")
            return content
    except Exception as e:
        print(f"Erro ao baixar datafeed (usando timeout de seguranca): {e}")
        return None

def parse_datafeed(data_bytes):
    """
    Detecta o formato do arquivo (ZIP, GZ ou CSV plano) e retorna os registros como lista de dicionarios.
    """
    # Verifica se e ZIP
    if data_bytes.startswith(b'PK\x03\x04'):
        print("Arquivo ZIP detectado. Descompactando...")
        with zipfile.ZipFile(BytesIO(data_bytes)) as z:
            for file_name in z.namelist():
                if file_name.endswith('.csv'):
                    print(f"Processando arquivo CSV interno: {file_name}")
                    return parse_csv(z.read(file_name).decode('utf-8', errors='ignore'))
                elif file_name.endswith('.xml'):
                    print(f"Arquivo XML detectado no ZIP. Ignorando no momento...")
    # Verifica se e GZIP
    elif data_bytes.startswith(b'\x1f\x8b'):
        print("Arquivo GZIP detectado. Descompactando...")
        with gzip.GzipFile(fileobj=BytesIO(data_bytes)) as f:
            return parse_csv(f.read().decode('utf-8', errors='ignore'))
    else:
        # Tenta decodificar como CSV plano
        try:
            return parse_csv(data_bytes.decode('utf-8'))
        except UnicodeDecodeError:
            return parse_csv(data_bytes.decode('latin1', errors='ignore'))
    return []

def parse_csv(csv_text):
    """
    Parseia o texto CSV e retorna dicionarios estruturados.
    Detecta delimitador automaticamente (, ou ;) e mapeia cabecalhos.
    """
    lines = csv_text.splitlines()
    if not lines:
        return []
    
    # Detecta delimitador
    first_line = lines[0]
    delimiter = ';' if ';' in first_line else ','
    
    reader = csv.DictReader(lines, delimiter=delimiter)
    return list(reader)

def score_and_filter_products(products):
    """
    Filtra produtos fora da conformidade e ranqueia os restantes por lucratividade.
    """
    filtered_list = []
    blocked_count = 0
    
    for p in products:
        # Normalizacao de chaves comuns do feed da Shopee
        name = p.get('product_name') or p.get('Product Name') or p.get('title') or p.get('nome') or ""
        category = p.get('category') or p.get('Category') or p.get('categoria') or ""
        link = p.get('affiliate_link') or p.get('Affiliate Link') or p.get('link') or p.get('url') or ""
        image = p.get('image_url') or p.get('Image URL') or p.get('imagem') or ""
        price_str = p.get('price') or p.get('Price') or p.get('preco') or "0"
        comm_rate_str = p.get('commission_rate') or p.get('Commission Rate') or p.get('comissao') or "0"
        
        # Limpar preco e comissao
        try:
            price = float(re.sub(r'[^\d\.]', '', price_str.replace(',', '.')))
        except ValueError:
            price = 0.0
            
        try:
            comm_rate = float(re.sub(r'[^\d\.]', '', comm_rate_str.replace(',', '.')))
            if comm_rate > 1:
                comm_rate = comm_rate / 100.0
        except ValueError:
            comm_rate = 0.0
            
        commission_value = price * comm_rate
        
        if not name or not link:
            continue
            
        # 1. Filtro de Conformidade
        if not is_compliant(name, category):
            blocked_count += 1
            continue
            
        # 2. Atribuir pontuacao de lucratividade
        score = 0
        
        # Preco ideal para conversao por impulso (R$ 15 a R$ 99)
        if 15.0 <= price <= 99.0:
            score += 30
        elif 99.0 < price <= 200.0:
            score += 15
        elif 5.0 <= price < 15.0:
            score += 10
            
        # Taxa de comissao (ideal acima de 10%)
        if comm_rate >= 0.12:
            score += 40
        elif comm_rate >= 0.08:
            score += 25
        elif comm_rate >= 0.05:
            score += 10
            
        # Valor bruto da comissao
        if commission_value >= 15.0:
            score += 30
        elif commission_value >= 8.0:
            score += 20
        elif commission_value >= 3.0:
            score += 10
            
        # Categorias de Alta Conversao em Videos (utilidades, decoracao, gadgets)
        hot_categories = ["casa", "cozinha", "organizacao", "decoracao", "gadget", "eletronico", "utilidade", "brinquedo", "pet"]
        if any(hot in category.lower() or hot in name.lower() for hot in hot_categories):
            score += 20
            
        filtered_list.append({
            'name': name.strip(),
            'category': category.strip(),
            'link': link.strip(),
            'image': image.strip(),
            'price': round(price, 2),
            'commission_rate': round(comm_rate * 100, 1),
            'commission_value': round(commission_value, 2),
            'score': score
        })
        
    # Ordena por pontuacao decrescente (mais lucrativos primeiro)
    filtered_list.sort(key=lambda x: x['score'], reverse=True)
    
    # Atribui um codigo de busca sequencial facil (ex: 101, 102...) para facilitar busca no video
    for idx, item in enumerate(filtered_list):
        item['code'] = str(101 + idx)
        
    print(f"Filtragem concluida. Total processado: {len(products)} | Aprovados: {len(filtered_list)} | Bloqueados (Regras): {blocked_count}")
    return filtered_list

def generate_mock_datafeed():
    """
    Gera um datafeed ficticio para demonstracao caso o download falhe ou nao seja fornecido.
    """
    print("Gerando datafeed ficticio para teste de conformidade...")
    return [
        # APROVADOS
        {"product_name": "Organizador de Geladeira Giratorio 360 Graus", "category": "Utilidades Domesticas", "affiliate_link": "https://shopee.com.br/m/ChoiceOficial-aff", "image_url": "https://images.unsplash.com/photo-1595341888016-a392ef81b7de?w=400", "price": "49.90", "commission_rate": "12"},
        {"product_name": "Mini Processador de Alimentos USB Recarregavel", "category": "Cozinha", "affiliate_link": "https://shopee.com.br/m/ChoiceOficial-aff", "image_url": "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=400", "price": "29.90", "commission_rate": "10"},
        {"product_name": "Mop Limpeza Pratica com Balde Centrifuga", "category": "Limpeza", "affiliate_link": "https://shopee.com.br/m/ChoiceOficial-aff", "image_url": "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400", "price": "79.90", "commission_rate": "8"},
        {"product_name": "Luminaria LED de Mesa Touch com Carregador Sem Fio", "category": "Iluminacao / Quarto", "affiliate_link": "https://shopee.com.br/m/ChoiceOficial-aff", "image_url": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400", "price": "119.00", "commission_rate": "14"},
        {"product_name": "Rolo Adesivo Lavavel para Tirar Pelos de Roupa", "category": "Utilidades Domesticas", "affiliate_link": "https://shopee.com.br/m/ChoiceOficial-aff", "image_url": "https://images.unsplash.com/photo-1528740561666-bd247e66ad50?w=400", "price": "19.90", "commission_rate": "12"},
        {"product_name": "Aspirador de Po Portatil para Carro de Alta Potencia", "category": "Automotivo", "affiliate_link": "https://shopee.com.br/m/ChoiceOficial-aff", "image_url": "https://images.unsplash.com/photo-1563720223185-11003d516935?w=400", "price": "65.00", "commission_rate": "15"},
        
        # PROIBIDOS (Devem ser bloqueados pelo filtro)
        {"product_name": "Capsula de Emagrecimento Ultra Rápido Seca Barriga", "category": "Saude / Perda de Peso", "affiliate_link": "https://shope.ee/block1", "image_url": "", "price": "89.90", "commission_rate": "15"},
        {"product_name": "Oculos de Grau Perto e Longe Multifocal TR90", "category": "Acessorios", "affiliate_link": "https://shope.ee/block2", "image_url": "", "price": "59.90", "commission_rate": "10"},
        {"product_name": "Vape Pod Descartavel Ignite 5000 Puffs Melancia", "category": "Tabacaria", "affiliate_link": "https://shope.ee/block3", "image_url": "", "price": "95.00", "commission_rate": "12"},
        {"product_name": "Micro Camera Espia Oculta Wifi Invisivel", "category": "Seguranca", "affiliate_link": "https://shope.ee/block4", "image_url": "", "price": "120.00", "commission_rate": "10"},
        {"product_name": "Kit Acido Hialuronico Injetavel Preenchimento Labial", "category": "Estetica", "affiliate_link": "https://shope.ee/block5", "image_url": "", "price": "350.00", "commission_rate": "12"},
        {"product_name": "Aparelho Receptor TV Box Desbloqueado Canais Vitalicios", "category": "Eletronicos", "affiliate_link": "https://shope.ee/block6", "image_url": "", "price": "249.00", "commission_rate": "8"},
        {"product_name": "Curso Como Ganhar R$1000 por Dia no Shopee", "category": "Infoprodutos", "affiliate_link": "https://shope.ee/block7", "image_url": "", "price": "49.00", "commission_rate": "50"},
    ]

def main():
    import argparse
    parser = argparse.ArgumentParser(description="Processador e Filtro de Seguranca de Datafeed Shopee")
    parser.add_argument("-u", "--url", help="URL do Datafeed Shopee (.ZIP / .CSV)")
    parser.add_argument("-f", "--file", help="Caminho para arquivo CSV/ZIP local")
    parser.add_argument("-o", "--output-dir", default=".", help="Diretorio de saida dos arquivos gerados")
    args = parser.parse_args()
    
    products = []
    
    # 1. Obter dados
    if args.url:
        data_bytes = download_datafeed(args.url)
        if data_bytes:
            products = parse_datafeed(data_bytes)
    elif args.file:
        if os.path.exists(args.file):
            print(f"Lendo arquivo local: {args.file}")
            with open(args.file, 'rb') as f:
                products = parse_datafeed(f.read())
        else:
            print(f"Erro: Arquivo local nao encontrado: {args.file}")
            
    if not products:
        print("Aviso: Nenhum datafeed valido foi lido. Utilizando dados simulados para demonstracao.")
        products = generate_mock_datafeed()
        
    # 2. Filtrar e ranquear
    filtered_products = score_and_filter_products(products)
    
    # 3. Exportar resultados
    os.makedirs(args.output_dir, exist_ok=True)
    
    # JSON para o Frontend
    json_path = os.path.join(args.output_dir, "shopee_products_filtered.json")
    with open(json_path, 'w', encoding='utf-8') as jf:
        json.dump(filtered_products, jf, ensure_ascii=False, indent=2)
    print(f"Exportado JSON: {json_path}")
    
    # CSV para controle
    csv_path = os.path.join(args.output_dir, "shopee_products_filtered.csv")
    with open(csv_path, 'w', encoding='utf-8', newline='') as cf:
        if filtered_products:
            writer = csv.DictWriter(cf, fieldnames=filtered_products[0].keys())
            writer.writeheader()
            writer.writerows(filtered_products)
    print(f"Exportado CSV: {csv_path}")
    
    print("=== TOP 5 PRODUTOS SELECIONADOS E SEGUROS ===")
    for p in filtered_products[:5]:
        print(f"Cod: {p['code']} | Pontos: {p['score']} | Comissao: R${p['commission_value']} ({p['commission_rate']}%) | {p['name'][:50]}")

if __name__ == "__main__":
    main()
