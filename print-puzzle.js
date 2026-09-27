(() => {
  const active = new Set();
  for (const [rowOffset, columnOffset] of [[0, 0], [3, 3]])
    for (let row = 0; row < 9; row += 1)
      for (let column = 0; column < 9; column += 1)
        active.add((rowOffset + row) * 12 + columnOffset + column);
  const hasCell = (row, column) => active.has(row * 12 + column);

  const stroke = (ctx, gridSize) => ({
    light: () => { ctx.strokeStyle = "#bbb"; ctx.lineWidth = Math.max(1, gridSize / 300); },
    medium: () => { ctx.strokeStyle = "#666"; ctx.lineWidth = Math.max(1.5, gridSize / 200); },
    heavy: () => { ctx.strokeStyle = "#111"; ctx.lineWidth = Math.max(2.5, gridSize / 120); }
  });

  function renderBoard(canvas, rows, opts = {}) {
    const { cellSize = 50, margin = cellSize * 0.5, givenColor = "#111", emptyColor = "#999" } = opts;
    const boardSize = cellSize * 12;
    const totalSize = boardSize + margin * 2;
    canvas.width = canvas.height = totalSize;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, totalSize, totalSize);
    ctx.translate(margin, margin);

    const s = stroke(ctx, cellSize);

    for (let row = 0; row < 12; row += 1) {
      for (let column = 0; column < 12; column += 1) {
        if (!hasCell(row, column)) continue;
        const x = column * cellSize, y = row * cellSize;
        ctx.fillStyle = "#fff";
        ctx.fillRect(x, y, cellSize, cellSize);
        s.light();
        ctx.strokeRect(x, y, cellSize, cellSize);
        const value = rows[row][column];
        const isGiven = value !== ".";
        if (isGiven) {
          ctx.fillStyle = givenColor;
          ctx.font = `bold ${Math.round(cellSize * 0.56)}px "Arial", "Helvetica", sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(value, (column + 0.5) * cellSize, (row + 0.53) * cellSize);
        }
      }
    }

    s.heavy();
    const vLines = [0, 3, 6, 9, 12];
    const hLines = [0, 3, 6, 9, 12];
    vLines.forEach(x => {
      ctx.beginPath(); ctx.moveTo(x * cellSize, 0); ctx.lineTo(x * cellSize, boardSize); ctx.stroke();
    });
    hLines.forEach(y => {
      ctx.beginPath(); ctx.moveTo(0, y * cellSize); ctx.lineTo(boardSize, y * cellSize); ctx.stroke();
    });

    s.medium();
    [
      [0, 0, 9, 0], [0, 3, 12, 3], [0, 6, 12, 6], [0, 9, 12, 9], [3, 12, 12, 12]
    ].forEach(([x1, y1, x2, y2]) => {
      ctx.beginPath(); ctx.moveTo(x1 * cellSize, y1 * cellSize); ctx.lineTo(x2 * cellSize, y2 * cellSize); ctx.stroke();
    });
    [
      [0, 0, 0, 9], [3, 0, 3, 12], [6, 0, 6, 12], [9, 0, 9, 12], [12, 3, 12, 12]
    ].forEach(([x1, y1, x2, y2]) => {
      ctx.beginPath(); ctx.moveTo(x1 * cellSize, y1 * cellSize); ctx.lineTo(x2 * cellSize, y2 * cellSize); ctx.stroke();
    });

    ctx.translate(-margin, -margin);
  }

  function renderPuzzlePage(pageCanvas, puzzles, opts = {}) {
    const { cols = 2, rowsPerPage = 3, cellSize = 36, margin = 30, title = "" } = opts;
    const boardPixel = cellSize * 12 + margin * 2;
    const gap = 16;
    const pageWidth = cols * boardPixel + (cols - 1) * gap + 40;
    const pageHeight = rowsPerPage * boardPixel + (rowsPerPage - 1) * gap + 60 + (title ? 30 : 0);
    pageCanvas.width = pageWidth;
    pageCanvas.height = pageHeight;
    const ctx = pageCanvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, pageWidth, pageHeight);

    let yOffset = 10;
    if (title) {
      ctx.fillStyle = "#333";
      ctx.font = "bold 18px 'Arial', 'Helvetica', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(title, pageWidth / 2, yOffset);
      yOffset += 30;
    }

    puzzles.forEach((puzzle, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols) % rowsPerPage;
      if (row >= rowsPerPage) return;
      const x = 20 + col * (boardPixel + gap);
      const y = yOffset + row * (boardPixel + gap);

      const label = `${puzzle.label || `Puzzle #${puzzle.id}`}`;
      ctx.fillStyle = "#555";
      ctx.font = "11px 'Arial', 'Helvetica', sans-serif";
      ctx.textAlign = "left";
      ctx.textBaseline = "bottom";
      ctx.fillText(label, x + margin, y + margin - 2);
      if (puzzle.meta) {
        ctx.fillStyle = "#888";
        ctx.font = "10px 'Arial', 'Helvetica', sans-serif";
        ctx.fillText(puzzle.meta, x + margin, y + margin - 2);
      }

      const subCanvas = document.createElement("canvas");
      renderBoard(subCanvas, puzzle.rows, { cellSize, margin, givenColor: "#111" });
      ctx.drawImage(subCanvas, x, y);
    });
  }

  function rowStringsToArrays(rows) {
    return rows.map(row => row.length === 12 ? row.split("") : row);
  }

  window.printPuzzle = {
    renderBoard,
    renderPuzzlePage,
    rowStringsToArrays
  };
})();