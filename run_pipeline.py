# -*- coding: utf-8 -*-
"""
Pipeline de Automacao de Afiliado Shopee (Orquestrador)
Este script unifica:
1. Atualizacao do Datafeed Shopee
2. Filtragem de Conformidade de Produtos (Filtro Antiban)
3. Geracao da Base de Dados da Vitrine
4. Deploy automatico para o GitHub Pages (Git push)
"""

import os
import sys
import subprocess
import argparse

def run_command(cmd, shell=False):
    """Auxiliar para rodar comandos do sistema de forma segura"""
    try:
        result = subprocess.run(cmd, shell=shell, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Erro ao executar comando: {e}")
        print(f"Detalhes do erro: {e.stderr}")
        return False

def main():
    parser = argparse.ArgumentParser(description="Orquestrador do Funil Automatico de Afiliado Shopee")
    parser.add_argument("-u", "--url", default="https://affiliate.shopee.com.br/api/v1/datafeed/download?id=YWJjZGVmZ2hpamtsbW5vcPNcbnfdFhhQkoz1FtnUm6DtED25ejObtofpYLqHBC0h", help="URL do seu Datafeed oficial da Shopee")
    parser.add_argument("-p", "--push", action="store_true", help="Ativa o deploy automatico via Git Push para o GitHub Pages")
    args = parser.parse_args()

    print("====================================================")
    print(" INICIANDO PIPELINE DE ATUALIZACAO AUTOMATICA")
    print("====================================================")

    # Passo 1: Rodar o script de Mineracao e Filtragem de Conformidade
    print("\n[Passo 1] Baixando datafeed e aplicando filtros anti-ban...")
    feed_success = run_command([
        sys.executable, 
        "process_datafeed.py", 
        "-u", args.url, 
        "-o", "."
    ])
    
    if not feed_success:
        print("[ERRO] Falha ao processar o datafeed. Abortando pipeline.")
        sys.exit(1)

    # Passo 2: Executar Deploy no GitHub Pages (se solicitado)
    if args.push:
        print("\n[Passo 2] Preparando deploy automatico no GitHub Pages...")
        
        # Verifica se o diretorio e um repositorio git
        if not os.path.exists(".git"):
            print("[Aviso] Repositorio Git nao iniciado. Iniciando...")
            run_command(["git", "init"])
            run_command(["git", "branch", "-M", "main"])

        # Commita os novos produtos e empurra para a nuvem
        print("Adicionando arquivos modificados...")
        run_command(["git", "add", "index.html", "shopee_products_filtered.json"])
        
        commit_message = "Atualizacao automatica do catalogo Shopee (Filtro Seguro)"
        print(f"Criando commit: '{commit_message}'...")
        # Ignora erro se nao houver alteracoes pendentes
        run_command(["git", "commit", "-m", commit_message], shell=True)
        
        print("Enviando alteracoes para o repositorio remoto (GitHub)...")
        # Este comando assume que voce ja configurou o 'git remote add origin' previamente.
        push_success = run_command(["git", "push", "origin", "main"])
        
        if push_success:
            print("\n[SUCESSO] VITRINE WEB ATUALIZADA ONLINE COM SUCESSO!")
        else:
            print("\n[ERRO] Falha ao enviar para o repositorio remoto. Verifique a configuracao de origens do Git.")
    else:
        print("\n[Passo 2] Deploy via Git ignorado. Execute o script com a flag '--push' para enviar ao GitHub.")

    print("\n====================================================")
    print(" PROCESSO CONCLUIDO!")
    print("====================================================")

if __name__ == "__main__":
    main()
