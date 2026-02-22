# Instrucciones para el Agente Colaborador

**Conexión**: Este agente debe estar vinculado al repositorio: https://github.com/rgarciarojo76-ctrl/Metodo-INRS.git

**Rama de Trabajo**: Es obligatorio crear y usar **exclusivamente** la rama `dev-colaborador`.

**Entorno**:

- Instalar dependencias de Node.js (`npm install`).
- Instalar dependencias de Python (`requirements.txt` en su entorno virtual, en caso de existir scripts de Python).

**Despliegue Local**: Usar `vercel dev` para previsualizar. _(Alternativa: `npm run dev`)_.

**Sincronización**: Cada avance debe subirse automáticamente mediante los comandos correspondientes y hacer push a la rama de colaboración:
`git push origin dev-colaborador`
