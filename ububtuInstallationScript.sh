#!/bin/bash

sudo apt install node npm
npm i
sudo snap install ollama
ollama pull gemma3:12b

ollama serve

echo "initialisation completed"
