const fs = require('fs');

const path = "D:/Yash Coding2/PixelPunch/shared/utils/pdf-generator.ts";
let content = fs.readFileSync(path, "utf-8");

// We need to reorder "90-DAY ROADMAP" and "OPTIMIZATION OPPORTUNITIES" (and similarly for Opportunity).
// We also need to add a bounding box around them.

// To do this reliably, we will write a helper function to inject bounding boxes.
// Actually, it's easier if we just write a brand new script that re-generates the file.
// Or we can just use simple string replacement to inject the bounding box drawing commands at the start of each section, and update currentY.

// Since the user wants it to look "perfectly", I will replace the Cost and Opportunity blocks with a fully refactored version that draws proper container boxes.

const newCostBlock = `
  if (data.reportType === "cost") {
    const drawContainer = (title, heightNeeded, drawContent) => {
       checkSpace(heightNeeded);
       const boxTop = currentY;
       
       // Draw title
       drawText(title, 40, 'F2', 14, 0.06, 0.09, 0.16);
       currentY -= 20;
       
       // Call content drawing which updates currentY
       drawContent();
       
       const boxBottom = currentY;
       const boxHeight = boxTop - boxBottom + 15; // padding
       
       // Draw bounding box
       // Because we are streaming PDF shapes, we ideally want the background drawn BEFORE text.
       // But in our current architecture, shapes and text are accumulated and then dumped. 
       // Shapes are dumped BEFORE text! So we can just push the bounding box shape here and it will render behind the text!
       // Perfect!
       currentPage.shapes.unshift(\`0.88 0.91 0.94 RG\\n1 w\\n\${roundedRectPath(20, boxBottom - 10, 555, boxHeight, 8)} S\`);
       
       currentY = boxBottom - 30; // space after container
    };

    // 1. Savings Projection
    drawContainer("SAVINGS PROJECTION AND NEXT STEPS", 250, () => {
        const projDesc = "The audit summary suggests meaningful savings are available once repeated token waste, unnecessary context injection, and un-routed model calls are reduced.";
        const projDescLines = wrapText(projDesc, 90);
        for (const line of projDescLines) {
          drawText(line, 40, 'F1', 10, 0.28, 0.33, 0.41);
          currentY -= 15;
        }
        currentY -= 10;
        
        const startY = currentY;
        const rowH = 28;
        const rows = [
          { label: "Current monthly AI spend", val: "$12,500", bg: "0.97 0.98 0.99" },
          { label: "Month 1 after quick wins", val: "$10,400", bg: "1.0 1.0 1.0" },
          { label: "Month 2 after routing + caching", val: "$8,900", bg: "0.97 0.98 0.99" },
          { label: "Month 3 after full optimisation", val: "$7,600", bg: "1.0 1.0 1.0" },
          { label: "Estimated annual savings", val: "$54,000", bg: "0.94 0.99 0.95" }
        ];
        
        const tW = 515;
        for (let i = 0; i < rows.length; i++) {
           const bg = rows[i].bg;
           currentPage.shapes.push(\`\${bg} rg\\n40 \${currentY - rowH} \${tW} \${rowH} re f\`);
           currentPage.shapes.push(\`0.88 0.91 0.94 RG\\n1 w\\n40 \${currentY} m \${40 + tW} \${currentY} l S\`);
           
           const textY = currentY - 18;
           currentPage.textLines.push({ text: rows[i].label, x: 50, y: textY, font: 'F2', size: 10, r: 0.2, g: 0.25, b: 0.33 });
           currentPage.textLines.push({ text: rows[i].val, x: 310, y: textY, font: 'F2', size: 11, r: 0.06, g: 0.09, b: 0.16 });
           
           currentY -= rowH;
        }
        currentPage.shapes.push(\`0.88 0.91 0.94 RG\\n1 w\\n40 \${currentY} m \${40 + tW} \${currentY} l S\`);
        currentPage.shapes.push(\`0.88 0.91 0.94 RG\\n1 w\\n40 \${startY} m 40 \${currentY} l S\`);
        currentPage.shapes.push(\`0.88 0.91 0.94 RG\\n1 w\\n300 \${startY} m 300 \${currentY} l S\`);
        currentPage.shapes.push(\`0.88 0.91 0.94 RG\\n1 w\\n\${40+tW} \${startY} m \${40+tW} \${currentY} l S\`);
    });

    // 2. Optimization Opportunities
    drawContainer("OPTIMIZATION OPPORTUNITIES", 400, () => {
        const oppDescLines = wrapText("These are the highest-leverage moves based on the audit pattern. The goal is to reduce token waste without changing the product experience.", 90);
        for (const line of oppDescLines) {
          drawText(line, 40, 'F1', 10, 0.28, 0.33, 0.41);
          currentY -= 15;
        }
        currentY -= 10;
        
        const ow = 164;
        const oh = 90;
        const opps = [
          { title: "Prompt Caching", desc: "Activate cache headers on all system instructions over 1k tokens. This can cut repeated input cost significantly.", border: "0.23 0.51 0.96", bg: "1.0 1.0 1.0" },
          { title: "Model Tiering", desc: "Route simple formatting, classification, and low-complexity actions to lighter models automatically.", border: "0.66 0.33 0.83", bg: "1.0 1.0 1.0" },
          { title: "RAG Pruning", desc: "Shrink chunk sizes, remove duplicate context, and add hybrid reranking before prompt assembly.", border: "0.13 0.77 0.36", bg: "1.0 1.0 1.0" }
        ];
        
        for (let i = 0; i < opps.length; i++) {
           const ox = 40 + i * (ow + 11);
           const oy = currentY - oh;
           currentPage.shapes.push(\`\${opps[i].bg} rg\\n\${roundedRectPath(ox, oy, ow, oh, 4)} f\`);
           currentPage.shapes.push(\`\${opps[i].border} RG\\n1.5 w\\n\${roundedRectPath(ox, oy, ow, oh, 4)} S\`);
           currentPage.textLines.push({ text: opps[i].title, x: ox + 12, y: currentY - 18, font: 'F2', size: 10, r: 0.06, g: 0.09, b: 0.16 });
           
           let iy = oy + oh - 35;
           const dLines = wrapText(opps[i].desc, 27);
           for (const line of dLines) {
              currentPage.textLines.push({ text: line, x: ox + 12, y: iy, font: 'F1', size: 9, r: 0.28, g: 0.33, b: 0.41 });
              iy -= 12;
           }
        }
        currentY -= (oh + 20);
        
        drawText("Quick Wins", 40, 'F2', 12, 0.06, 0.09, 0.16);
        currentY -= 20;
        const wins = [
          "Enable native provider Prompt Caching for system prompts exceeding 1,024 tokens.",
          "Adopt Model Tiering: Route simple formatting queries to lighter model weights.",
          "Shrink RAG chunk sizes and add hybrid reranking to cut irrelevant context.",
          "Introduce semantic filters before prompt assembly to avoid context bloat."
        ];
        for (const win of wins) {
           const wLines = wrapText(win, 90);
           for (let i = 0; i < wLines.length; i++) {
              drawText(i===0 ? "__BULLET__ " + wLines[i] : wLines[i], i===0 ? 40 : 50, 'F1', 10, 0.28, 0.33, 0.41);
              currentY -= 15;
           }
           currentY -= 5;
        }
        currentY -= 20;
        
        drawText("Current Architecture Analysis", 40, 'F2', 14, 0.06, 0.09, 0.16);
        currentY -= 15;
        const archLines = wrapText("Known information from the code indicates Azure OpenAI as the primary provider, Linux as the cloud layer, and a vector database in the stack. The evaluation suggests the current workflow likely sends large system prompts and RAG context without gateway-level optimization.", 95);
        for (const line of archLines) {
          drawText(line, 40, 'F1', 9, 0.28, 0.33, 0.41);
          currentY -= 12;
        }
        currentY -= 20;
        
        const cy = currentY - 50;
        const bh = 45;
        const nW = 115;
        const nodeX1 = 50;
        const nodeX2 = 200;
        const nodeX3 = 350;
        
        const drawLine = (xA, yA, xB, yB) => {
           currentPage.shapes.push(\`0.8 0.8 0.8 RG\\n1 w\\n\${xA} \${yA} m \${xB} \${yB} l S\`);
        };
        
        drawLine(nodeX1+nW, cy+bh/2, nodeX2, cy+bh/2); 
        drawLine(nodeX2+nW, cy+bh/2, nodeX3, cy+bh/2); 
        drawLine(nodeX1+nW/2, cy, nodeX1+nW/2, cy-30);
        drawLine(nodeX2+nW/2, cy, nodeX2+nW/2, cy-30); 
        drawLine(nodeX3+nW/2, cy, nodeX3+nW/2, cy-30); 
        
        const drawBox = (x, y, title, subtitle, bCol, bgCol) => {
           currentPage.shapes.push(\`\${bgCol} rg\\n\${roundedRectPath(x, y, nW, bh, 4)} f\`);
           currentPage.shapes.push(\`\${bCol} RG\\n1 w\\n\${roundedRectPath(x, y, nW, bh, 4)} S\`);
           currentPage.textLines.push({ text: title, x: x + 10, y: y + bh - 16, font: 'F2', size: 10, r: 0.06, g: 0.09, b: 0.16 });
           const stLines = wrapText(subtitle, 24);
           for (let i = 0; i < stLines.length; i++) {
             currentPage.textLines.push({ text: stLines[i], x: x + 10, y: y + bh - 28 - (i*9), font: 'F1', size: 8, r: 0.4, g: 0.45, b: 0.5 });
           }
        };
        
        drawBox(nodeX1, cy, "Users", "Requests, prompts, and workflows", "0.6 0.7 0.9", "0.96 0.98 1");
        drawBox(nodeX2, cy, "App Layer", "Client APIs, routes, auth", "0.2 0.8 0.6", "0.92 0.99 0.95");
        drawBox(nodeX3, cy, "Model Gateway", "LiteLLM, Portkey, Cloudflare", "0.6 0.5 0.9", "0.96 0.94 1");
        drawBox(nodeX2, cy-30-bh, "Vector DB", "Pinecone, Weaviate, metadata filters", "0.2 0.8 0.6", "0.92 0.99 0.95");
        drawBox(nodeX3, cy-30-bh, "Azure OpenAI", "Production calls and token spend", "0.9 0.6 0.6", "1 0.95 0.95");
        
        currentY = cy - 30 - bh - 30;
        
        const tW2 = 515;
        const rowH2 = 60;
        const ty = currentY - rowH2;
        
        currentPage.shapes.push(\`0.97 0.98 0.99 rg\\n40 \${currentY - 20} \${tW2} 20 re f\`);
        currentPage.shapes.push(\`0.88 0.91 0.94 RG\\n1 w\\n40 \${currentY} m \${40 + tW2} \${currentY} l S\`);
        currentPage.shapes.push(\`0.88 0.91 0.94 RG\\n1 w\\n40 \${currentY-20} m \${40 + tW2} \${currentY-20} l S\`);
        currentPage.shapes.push(\`0.88 0.91 0.94 RG\\n1 w\\n40 \${ty} m \${40 + tW2} \${ty} l S\`);
        currentPage.shapes.push(\`0.88 0.91 0.94 RG\\n1 w\\n40 \${ty} m 40 \${currentY} l S\`);
        currentPage.shapes.push(\`0.88 0.91 0.94 RG\\n1 w\\n290 \${ty} m 290 \${currentY} l S\`);
        currentPage.shapes.push(\`0.88 0.91 0.94 RG\\n1 w\\n\${40+tW2} \${ty} m \${40+tW2} \${currentY} l S\`);
        
        drawText("Observed Risks", 50, 'F2', 10, 0.2, 0.25, 0.33);
        drawText("What to fix first", 300, 'F2', 10, 0.2, 0.25, 0.33);
        
        const risk1Lines = [
           "1. Direct provider calls likely increase vendor lock-in.",
           "2. Repeated system instructions ship in full each request.",
           "3. Static chunking can bloat prompt windows."
        ];
        let ry1 = currentY - 35;
        for (const line of risk1Lines) {
           drawText(line, 50, 'F1', 9, 0.28, 0.33, 0.41);
           ry1 -= 12;
        }
        
        const fix1Lines = [
           "1. Add a gateway for routing and logging.",
           "2. Enable native prompt caching.",
           "3. Reduce retrieval context with filters."
        ];
        let ry2 = currentY - 35;
        for (const line of fix1Lines) {
           drawText(line, 300, 'F1', 9, 0.28, 0.33, 0.41);
           ry2 -= 12;
        }
        currentY = ty - 20;
    });

    // 3. 90-Day Roadmap
    drawContainer("90-DAY ROADMAP", 200, () => {
        const rW = 164;
        const rH = 90;
        const roadmaps = [
          { title: "Immediate", items: ["Prompt caching", "Model routing", "RAG pruning"], bg: "0.94 0.97 1", border: "0.75 0.86 0.98" },
          { title: "30 Days", items: ["LiteLLM gateway", "Langfuse observability", "Semantic cache"], bg: "0.96 0.95 1", border: "0.85 0.82 0.98" },
          { title: "90 Days", items: ["Centralized governance", "Automated routing", "ROI dashboard"], bg: "0.94 0.99 0.95", border: "0.67 0.95 0.72" }
        ];
        
        for (let i = 0; i < roadmaps.length; i++) {
           const rx = 40 + i * (rW + 11);
           const ry = currentY - rH;
           currentPage.shapes.push(\`\${roadmaps[i].bg} rg\\n\${rx} \${ry} \${rW} \${rH} re f\`);
           currentPage.shapes.push(\`\${roadmaps[i].border} RG\\n1 w\\n\${rx} \${ry} \${rW} \${rH} re S\`);
           
           currentPage.textLines.push({ text: roadmaps[i].title, x: rx + 12, y: currentY - 18, font: 'F2', size: 11, r: 0.06, g: 0.09, b: 0.16 });
           
           let ix = rx + 12;
           let iy = ry + rH - 35;
           for (const item of roadmaps[i].items) {
              currentPage.textLines.push({ text: "__BULLET__ " + item, x: ix, y: iy, font: 'F1', size: 9, r: 0.2, g: 0.25, b: 0.33 });
              iy -= 15;
           }
        }
        currentY -= (rH + 20);
        
        drawText("Why this matters", 40, 'F2', 11, 0.06, 0.09, 0.16);
        currentY -= 15;
        const matterLines = wrapText("This roadmap is sequenced to create fast savings first, then better routing, then governance and reporting. That order usually improves ROI while keeping implementation risk low.", 90);
        for (const line of matterLines) {
          drawText(line, 40, 'F1', 10, 0.28, 0.33, 0.41);
          currentY -= 15;
        }
    });

  } else if (data.reportType === "opportunity") {
    const drawContainer = (title, heightNeeded, drawContent) => {
       checkSpace(heightNeeded);
       const boxTop = currentY;
       drawText(title, 40, 'F2', 14, 0.06, 0.09, 0.16);
       currentY -= 20;
       drawContent();
       const boxBottom = currentY;
       const boxHeight = boxTop - boxBottom + 15;
       currentPage.shapes.unshift(\`0.88 0.91 0.94 RG\\n1 w\\n\${roundedRectPath(20, boxBottom - 10, 555, boxHeight, 8)} S\`);
       currentY = boxBottom - 30;
    };

    drawContainer("VALUE PROJECTION AND NEXT STEPS", 250, () => {
        const projDesc = "The audit summary suggests significant revenue and efficiency gains are available by implementing AI-driven workflow automation and data monetization strategies.";
        const projDescLines = wrapText(projDesc, 90);
        for (const line of projDescLines) {
          drawText(line, 40, 'F1', 10, 0.28, 0.33, 0.41);
          currentY -= 15;
        }
        currentY -= 10;
        
        const startY = currentY;
        const rowH = 28;
        const rows = [
          { label: "Current AI Value Generation", val: "$0 / mo", bg: "0.97 0.98 0.99", tc: "0.06 0.09 0.16" },
          { label: "Month 1 (Internal Workflow Pilot)", val: "+$5,500 / mo", bg: "1.0 1.0 1.0", tc: "0.06 0.09 0.16" },
          { label: "Month 2 (Customer-Facing Chatbot)", val: "+$12,000 / mo", bg: "0.97 0.98 0.99", tc: "0.06 0.09 0.16" },
          { label: "Month 3 (Data Monetization Engine)", val: "+$25,000 / mo", bg: "1.0 1.0 1.0", tc: "0.06 0.09 0.16" },
          { label: "Estimated Annual Value Creation", val: "$215,000+", bg: "0.94 0.99 0.95", tc: "0.08 0.50 0.15" }
        ];
        
        const tW = 515;
        for (let i = 0; i < rows.length; i++) {
           const bg = rows[i].bg;
           const valColors = rows[i].tc.split(" ").map(Number);
           currentPage.shapes.push(\`\${bg} rg\\n40 \${currentY - rowH} \${tW} \${rowH} re f\`);
           currentPage.shapes.push(\`0.88 0.91 0.94 RG\\n1 w\\n40 \${currentY} m \${40 + tW} \${currentY} l S\`);
           
           const textY = currentY - 18;
           currentPage.textLines.push({ text: rows[i].label, x: 50, y: textY, font: 'F2', size: 10, r: 0.2, g: 0.25, b: 0.33 });
           currentPage.textLines.push({ text: rows[i].val, x: 310, y: textY, font: 'F2', size: 11, r: valColors[0], g: valColors[1], b: valColors[2] });
           
           currentY -= rowH;
        }
        currentPage.shapes.push(\`0.88 0.91 0.94 RG\\n1 w\\n40 \${currentY} m \${40 + tW} \${currentY} l S\`);
        currentPage.shapes.push(\`0.88 0.91 0.94 RG\\n1 w\\n40 \${startY} m 40 \${currentY} l S\`);
        currentPage.shapes.push(\`0.88 0.91 0.94 RG\\n1 w\\n300 \${startY} m 300 \${currentY} l S\`);
        currentPage.shapes.push(\`0.88 0.91 0.94 RG\\n1 w\\n\${40+tW} \${startY} m \${40+tW} \${currentY} l S\`);
    });

    drawContainer("GROWTH OPPORTUNITIES", 400, () => {
        const oppDescLines = wrapText("These are the highest-leverage areas to inject AI into your business model based on the audit pattern. The goal is to create new value and competitive advantages.", 90);
        for (const line of oppDescLines) {
          drawText(line, 40, 'F1', 10, 0.28, 0.33, 0.41);
          currentY -= 15;
        }
        currentY -= 10;
        
        const ow = 164;
        const oh = 90;
        const opps = [
          { title: "Workflow Automation", desc: "Deploy AI agents to automate data entry and support triage.", border: "0.23 0.51 0.96", bg: "1.0 1.0 1.0" },
          { title: "Predictive Analytics", desc: "Utilize ML on customer data to predict churn and identify upsell opportunities automatically.", border: "0.66 0.33 0.83", bg: "1.0 1.0 1.0" },
          { title: "AI Product Features", desc: "Embed generative AI directly into your core product offering to create a premium experience.", border: "0.13 0.77 0.36", bg: "1.0 1.0 1.0" }
        ];
        
        for (let i = 0; i < opps.length; i++) {
           const ox = 40 + i * (ow + 11);
           const oy = currentY - oh;
           currentPage.shapes.push(\`\${opps[i].bg} rg\\n\${roundedRectPath(ox, oy, ow, oh, 4)} f\`);
           currentPage.shapes.push(\`\${opps[i].border} RG\\n1.5 w\\n\${roundedRectPath(ox, oy, ow, oh, 4)} S\`);
           currentPage.textLines.push({ text: opps[i].title, x: ox + 12, y: currentY - 18, font: 'F2', size: 10, r: 0.06, g: 0.09, b: 0.16 });
           
           let iy = oy + oh - 35;
           const dLines = wrapText(opps[i].desc, 27);
           for (const line of dLines) {
              currentPage.textLines.push({ text: line, x: ox + 12, y: iy, font: 'F1', size: 9, r: 0.28, g: 0.33, b: 0.41 });
              iy -= 12;
           }
        }
        currentY -= (oh + 20);
        
        drawText("Quick Wins", 40, 'F2', 12, 0.06, 0.09, 0.16);
        currentY -= 20;
        const wins = [
          "Deploy an internal knowledge base chatbot using a lightweight RAG system.",
          "Automate the categorization of incoming customer support tickets using an LLM API.",
          "Integrate an AI writing assistant into your team's content creation workflow.",
          "Set up automated weekly insights reports generated by AI from your analytics dashboards."
        ];
        for (const win of wins) {
           const wLines = wrapText(win, 90);
           for (let i = 0; i < wLines.length; i++) {
              drawText(i===0 ? "__BULLET__ " + wLines[i] : wLines[i], i===0 ? 40 : 50, 'F1', 10, 0.28, 0.33, 0.41);
              currentY -= 15;
           }
           currentY -= 5;
        }
        currentY -= 20;
        
        drawText("Proposed Architecture Analysis", 40, 'F2', 14, 0.06, 0.09, 0.16);
        currentY -= 15;
        const archLines = wrapText("Based on the opportunity audit, we recommend introducing a modern AI stack. This includes an AI Agent layer for orchestration, a Vector Database for semantic search over proprietary data, and a flexible LLM Gateway to avoid vendor lock-in.", 95);
        for (const line of archLines) {
          drawText(line, 40, 'F1', 9, 0.28, 0.33, 0.41);
          currentY -= 12;
        }
        currentY -= 20;
        
        const cy = currentY - 50;
        const bh = 45;
        const nW = 115;
        const nodeX1 = 50;
        const nodeX2 = 200;
        const nodeX3 = 350;
        
        const drawLine = (xA, yA, xB, yB) => {
           currentPage.shapes.push(\`0.8 0.8 0.8 RG\\n1 w\\n\${xA} \${yA} m \${xB} \${yB} l S\`);
        };
        
        drawLine(nodeX1+nW, cy+bh/2, nodeX2, cy+bh/2); 
        drawLine(nodeX2+nW, cy+bh/2, nodeX3, cy+bh/2); 
        drawLine(nodeX1+nW/2, cy, nodeX1+nW/2, cy-30);
        drawLine(nodeX2+nW/2, cy, nodeX2+nW/2, cy-30); 
        drawLine(nodeX3+nW/2, cy, nodeX3+nW/2, cy-30); 
        
        const drawBox = (x, y, title, subtitle, bCol, bgCol) => {
           currentPage.shapes.push(\`\${bgCol} rg\\n\${roundedRectPath(x, y, nW, bh, 4)} f\`);
           currentPage.shapes.push(\`\${bCol} RG\\n1 w\\n\${roundedRectPath(x, y, nW, bh, 4)} S\`);
           currentPage.textLines.push({ text: title, x: x + 10, y: y + bh - 16, font: 'F2', size: 10, r: 0.06, g: 0.09, b: 0.16 });
           const stLines = wrapText(subtitle, 24);
           for (let i = 0; i < stLines.length; i++) {
             currentPage.textLines.push({ text: stLines[i], x: x + 10, y: y + bh - 28 - (i*9), font: 'F1', size: 8, r: 0.4, g: 0.45, b: 0.5 });
           }
        };
        
        drawBox(nodeX1, cy, "Users / Customers", "New AI features", "0.6 0.7 0.9", "0.96 0.98 1");
        drawBox(nodeX1, cy-30-bh, "Internal Team", "Workflow automation", "0.6 0.7 0.9", "0.96 0.98 1");
        drawBox(nodeX2, cy, "New App Layer", "API routes, logic", "0.7 0.4 0.9", "0.96 0.94 1");
        drawBox(nodeX2, cy-30-bh, "AI Agent Framework", "Orchestration", "0.7 0.4 0.9", "0.96 0.94 1");
        drawBox(nodeX3, cy, "Vector DB", "Embeddings search", "0.2 0.8 0.6", "0.92 0.99 0.95");
        drawBox(nodeX3, cy-30-bh, "LLM Gateway", "OpenAI / Anthropic", "0.9 0.6 0.6", "1 0.95 0.95");
        
        currentY = cy - 30 - bh - 30;
        
        const tW2 = 515;
        const rowH2 = 60;
        const ty = currentY - rowH2;
        
        currentPage.shapes.push(\`0.97 0.98 0.99 rg\\n40 \${currentY - 20} \${tW2} 20 re f\`);
        currentPage.shapes.push(\`0.88 0.91 0.94 RG\\n1 w\\n40 \${currentY} m \${40 + tW2} \${currentY} l S\`);
        currentPage.shapes.push(\`0.88 0.91 0.94 RG\\n1 w\\n40 \${currentY-20} m \${40 + tW2} \${currentY-20} l S\`);
        currentPage.shapes.push(\`0.88 0.91 0.94 RG\\n1 w\\n40 \${ty} m \${40 + tW2} \${ty} l S\`);
        currentPage.shapes.push(\`0.88 0.91 0.94 RG\\n1 w\\n40 \${ty} m 40 \${currentY} l S\`);
        currentPage.shapes.push(\`0.88 0.91 0.94 RG\\n1 w\\n290 \${ty} m 290 \${currentY} l S\`);
        currentPage.shapes.push(\`0.88 0.91 0.94 RG\\n1 w\\n\${40+tW2} \${ty} m \${40+tW2} \${currentY} l S\`);
        
        drawText("Observed Gaps", 50, 'F2', 10, 0.2, 0.25, 0.33);
        drawText("What to build first", 300, 'F2', 10, 0.2, 0.25, 0.33);
        
        const risk1Lines = [
           "1. No mechanism to retrieve unstructured data.",
           "2. Core application lacks AI orchestration logic.",
           "3. Manual workflows bottleneck growth."
        ];
        let ry1 = currentY - 35;
        for (const line of risk1Lines) {
           drawText(line, 50, 'F1', 9, 0.28, 0.33, 0.41);
           ry1 -= 12;
        }
        
        const fix1Lines_opp = [
           "1. Spin up a Vector DB and embed docs.",
           "2. Integrate an Agent Framework.",
           "3. Build pilot for highest-friction workflow."
        ];
        let ry2_opp = currentY - 35;
        for (const line of fix1Lines_opp) {
           drawText(line, 300, 'F1', 9, 0.28, 0.33, 0.41);
           ry2_opp -= 12;
        }
        currentY = ty - 20;
    });

    drawContainer("90-DAY INNOVATION ROADMAP", 200, () => {
        const rW = 164;
        const rH = 90;
        const roadmaps = [
          { title: "Immediate", items: ["Identify high-friction workflows", "Select initial AI pilot use-case", "Build lightweight Proof of Concept"], bg: "0.94 0.97 1", border: "0.75 0.86 0.98" },
          { title: "30 Days", items: ["Deploy internal AI agent pilot", "Gather feedback & iterate", "Design customer integration"], bg: "0.96 0.95 1", border: "0.85 0.82 0.98" },
          { title: "90 Days", items: ["Launch customer AI features", "Implement RAG data pipeline", "Scale infrastructure & track ROI"], bg: "0.94 0.99 0.95", border: "0.67 0.95 0.72" }
        ];
        
        for (let i = 0; i < roadmaps.length; i++) {
           const rx = 40 + i * (rW + 11);
           const ry = currentY - rH;
           currentPage.shapes.push(\`\${roadmaps[i].bg} rg\\n\${rx} \${ry} \${rW} \${rH} re f\`);
           currentPage.shapes.push(\`\${roadmaps[i].border} RG\\n1 w\\n\${rx} \${ry} \${rW} \${rH} re S\`);
           
           currentPage.textLines.push({ text: roadmaps[i].title, x: rx + 12, y: currentY - 18, font: 'F2', size: 11, r: 0.06, g: 0.09, b: 0.16 });
           
           let ix = rx + 12;
           let iy = ry + rH - 35;
           for (const item of roadmaps[i].items) {
              currentPage.textLines.push({ text: "__BULLET__ " + item, x: ix, y: iy, font: 'F1', size: 9, r: 0.2, g: 0.25, b: 0.33 });
              iy -= 15;
           }
        }
        currentY -= (rH + 20);
        
        drawText("Why this matters", 40, 'F2', 11, 0.06, 0.09, 0.16);
        currentY -= 15;
        const matterLines = wrapText("This roadmap prioritizes low-risk, internal efficiency gains first to build confidence, followed by high-impact, revenue-generating customer features.", 90);
        for (const line of matterLines) {
          drawText(line, 40, 'F1', 10, 0.28, 0.33, 0.41);
          currentY -= 15;
        }
    });
  }
`;

// Now replace from `if (data.reportType === "cost") {` up to the end of the opportunity block.
const startIndex = content.indexOf('if (data.reportType === "cost") {');
const endIndex = content.indexOf('const pageCount = pagesData.length;');

if (startIndex !== -1 && endIndex !== -1) {
    const newContent = content.substring(0, startIndex) + newCostBlock + "\n  " + content.substring(endIndex);
    fs.writeFileSync(path, newContent);
    console.log("SUCCESS");
} else {
    console.log("COULD NOT FIND INDEXES");
}
