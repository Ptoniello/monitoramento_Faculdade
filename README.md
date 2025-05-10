Servidor criado utilizando Ubuntu 24.04;
Banco de dados postgresql;
Usuário e senha presentes no "server.js"

Para clonar em com SSH:
git clone git@github.com:Ptoniello/monitoramento_Faculdade.git

Para clonar com HTTPS:
https://github.com/Ptoniello/monitoramento_Faculdade.git

Instruções para enviar dados para o BD:
- necessário ter curl instalado
- Iniciar o servidor utilizando "node server.js"

Enviar informações:
  curl -X POST -H "Content-Type: application/json" -d '{
    "deviceId": "motor-XX",
    "vibration": X.Y,
    "temperature": XX,
    "humidity": XX,
    "accX": X.Y,
    "accY": -X.Y,
    "accZ": X.y,
    "timestamp": XXXXXXXXXX
  }' http://localhost:3000/api/sensor

Para verificação, envie:
  curl http://localhost:3000/api/sensor

para helth check, envie:
  curl http://localhost:3000/health
