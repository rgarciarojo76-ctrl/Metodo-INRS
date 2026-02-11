#!/bin/bash

# Vercel Deployment Script
# Automated guide for Vercel deployment

echo "🚀 Iniciando despliegue en Vercel..."
echo "-----------------------------------"
echo "El código ya está en GitHub: https://github.com/rgarciarojo76-ctrl/Metodo-INRS.git"
echo ""
echo "Se iniciará el asistente de Vercel."
echo "Sigue las instrucciones en pantalla (Login, Link Project, Deploy)."
echo "Normalmente solo necesitas presionar ENTER para aceptar las opciones por defecto."
echo ""
read -p "Presiona ENTER para comenzar el despliegue..."

npx vercel

echo ""
echo "🎉 ¡Despliegue finalizado!"
echo "Si el comando anterior tuvo éxito, verás la URL de producción arriba."
