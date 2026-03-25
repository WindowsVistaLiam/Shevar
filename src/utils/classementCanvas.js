const { createCanvas, loadImage } = require('canvas');
const { AttachmentBuilder } = require('discord.js');

const WIDTH = 1200;
const HEIGHT = 720;

function drawRoundedRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function drawCircleImage(ctx, image, x, y, size) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(image, x, y, size, size);
  ctx.restore();
}

function drawAvatarFallback(ctx, x, y, size, color = '#6b7280') {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();
}

async function tryLoadAvatar(user) {
  if (!user) return null;

  try {
    const avatarUrl = user.displayAvatarURL({ extension: 'png', size: 256, forceStatic: true });
    return await loadImage(avatarUrl);
  } catch {
    return null;
  }
}

function drawBackground(ctx) {
  const gradient = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  gradient.addColorStop(0, '#090b10');
  gradient.addColorStop(0.45, '#12161d');
  gradient.addColorStop(1, '#07090d');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const radial = ctx.createRadialGradient(WIDTH / 2, 120, 50, WIDTH / 2, HEIGHT / 2, 850);
  radial.addColorStop(0, 'rgba(255,255,255,0.04)');
  radial.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.fillStyle = radial;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

function drawFrame(ctx) {
  drawRoundedRect(ctx, 20, 20, WIDTH - 40, HEIGHT - 40, 26);
  ctx.fillStyle = 'rgba(15, 18, 24, 0.35)';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = 'rgba(201, 164, 84, 0.78)';
  ctx.stroke();

  drawRoundedRect(ctx, 34, 34, WIDTH - 68, HEIGHT - 68, 18);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = 'rgba(255, 225, 148, 0.12)';
  ctx.stroke();
}

function drawPodiumBase(ctx) {
  const centerX = WIDTH / 2;
  const baseY = 300;

  const blocks = [
    { x: centerX - 250, y: baseY + 55, w: 170, h: 120, color: '#5f6670' }, // 2
    { x: centerX - 85, y: baseY, w: 170, h: 175, color: '#d4af37' },        // 1
    { x: centerX + 80, y: baseY + 80, w: 170, h: 95, color: '#8d6f63' }     // 3
  ];

  for (const block of blocks) {
    drawRoundedRect(ctx, block.x, block.y, block.w, block.h, 20);
    ctx.fillStyle = block.color;
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.stroke();
  }
}

function drawRankMarker(ctx, rank, x, y, color) {
  ctx.save();
  ctx.fillStyle = color;

  if (rank === 1) {
    ctx.beginPath();
    ctx.arc(x, y, 26, 0, Math.PI * 2);
    ctx.fill();
  } else if (rank === 2) {
    drawRoundedRect(ctx, x - 24, y - 24, 48, 48, 12);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(x, y - 28);
    ctx.lineTo(x + 24, y + 18);
    ctx.lineTo(x - 24, y + 18);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

async function drawPodiumEntry(ctx, user, rank, x, y, accentColor) {
  const avatar = await tryLoadAvatar(user);
  const avatarSize = 104;

  ctx.save();
  ctx.shadowColor = accentColor;
  ctx.shadowBlur = 24;
  ctx.beginPath();
  ctx.arc(x + avatarSize / 2, y + avatarSize / 2, avatarSize / 2 + 5, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fill();
  ctx.restore();

  if (avatar) {
    drawCircleImage(ctx, avatar, x, y, avatarSize);
  } else {
    drawAvatarFallback(ctx, x, y, avatarSize, '#4b5563');
  }

  ctx.lineWidth = 4;
  ctx.strokeStyle = accentColor;
  ctx.beginPath();
  ctx.arc(x + avatarSize / 2, y + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
  ctx.stroke();

  drawRankMarker(ctx, rank, x + avatarSize / 2, y - 24, accentColor);
}

async function drawList(ctx, entries, usersMap) {
  const startY = 500;
  const rowHeight = 56;
  const left = 90;
  const width = WIDTH - 180;

  for (let i = 0; i < entries.length; i += 1) {
    const entry = entries[i];
    const y = startY + i * rowHeight;
    const user = usersMap.get(entry.userId);
    const avatar = await tryLoadAvatar(user);

    drawRoundedRect(ctx, left, y, width, 44, 14);
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)';
    ctx.fill();

    if (avatar) {
      drawCircleImage(ctx, avatar, left + 12, y + 6, 32);
    } else {
      drawAvatarFallback(ctx, left + 12, y + 6, 32, '#374151');
    }

    const medalColor =
      entry.rank === 1 ? '#d4af37' :
      entry.rank === 2 ? '#c0c7d1' :
      entry.rank === 3 ? '#b27d66' :
      '#7c8591';

    ctx.fillStyle = medalColor;
    ctx.beginPath();
    ctx.arc(left + 68, y + 22, 10, 0, Math.PI * 2);
    ctx.fill();
  }
}

async function createClassementAttachment({ paginatedItems, usersMap }) {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');

  drawBackground(ctx);
  drawFrame(ctx);
  drawPodiumBase(ctx);

  const topThree = paginatedItems.slice(0, 3);

  if (topThree[1]) {
    await drawPodiumEntry(
      ctx,
      usersMap.get(topThree[1].userId),
      topThree[1].rank,
      WIDTH / 2 - 215,
      225,
      '#c0c7d1'
    );
  }

  if (topThree[0]) {
    await drawPodiumEntry(
      ctx,
      usersMap.get(topThree[0].userId),
      topThree[0].rank,
      WIDTH / 2 - 52,
      155,
      '#e0b84d'
    );
  }

  if (topThree[2]) {
    await drawPodiumEntry(
      ctx,
      usersMap.get(topThree[2].userId),
      topThree[2].rank,
      WIDTH / 2 + 110,
      245,
      '#b27d66'
    );
  }

  await drawList(ctx, paginatedItems.slice(3), usersMap);

  const buffer = canvas.toBuffer('image/png');
  return new AttachmentBuilder(buffer, { name: 'classement-podium.png' });
}

module.exports = {
  createClassementAttachment
};