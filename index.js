const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

const API_URL = 'https://api.wsmt8g.cc/v2/history/getLastResult?gameId=ktrng_3932&size=120&tableId=39321215743193&curPage=1';

function ketQuaTuTong(tong) {
  return tong >= 11 ? 'Tài' : 'Xỉu';
}

function layPattern(ds) {
  return ds.map(obj => ketQuaTuTong(obj.score) === 'Tài' ? 'T' : 'X').join('');
}

function tao3DoanVi(score) {
  const ketQua = [];
  for (let i = -1; i <= 1; i++) {
    let tong = score + i;
    if (tong >= 3 && tong <= 18) {
      ketQua.push(tong);
    }
  }
  return ketQua;
}

// 🧠 Dự đoán bằng pattern: xem chuỗi 3 gần nhất khớp với gì thường ra tiếp theo
function duDoanBangPattern(historyPattern) {
  const sampleSize = 20;
  const len = historyPattern.length;
  if (len < 4) return 'Không đủ dữ liệu';

  const patternToFind = historyPattern.slice(0, 3); // ví dụ: TTX
  let nextCharCount = { T: 0, X: 0 };

  for (let i = 0; i < sampleSize; i++) {
    const slice = historyPattern.slice(i, i + 3);
    const nextChar = historyPattern[i + 3];
    if (slice === patternToFind && nextChar) {
      nextCharCount[nextChar]++;
    }
  }

  return (nextCharCount.T || 0) >= (nextCharCount.X || 0) ? 'Tài' : 'Xỉu';
}

app.get('/ketqua', async (req, res) => {
  try {
    const resApi = await axios.get(API_URL);
    const danhSach = resApi.data.data.resultList;

    const item = danhSach[0]; // phiên mới nhất
    const [xx1, xx2, xx3] = item.facesList;
    const tong = item.score;
    const ket_qua = ketQuaTuTong(tong);
    const patternFull = layPattern(danhSach.slice(1, 25)); // lấy 24 phiên gần nhất
    const patternShort = patternFull.slice(0, 20); // lấy 20 ký tự gần nhất

    const phienSo = parseInt(item.gameNum.replace('#', ''));
    const phien_hien_tai = (phienSo + 1).toString().padStart(7, '0'); // +1 và giữ 7 chữ số

    const doan_vi = tao3DoanVi(tong);
    const du_doan = duDoanBangPattern(patternShort);

    res.json({
      Phien: item.gameNum,
      Xuc_xac_1: xx1,
      Xuc_xac_2: xx2,
      Xuc_xac_3: xx3,
      Tong: tong,
      Ket_qua: ket_qua,
      Pattern: patternShort,
      phien_hien_tai: phien_hien_tai,
      Du_doan: du_doan,
      Doan_vi: doan_vi
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Lỗi khi gọi API hoặc xử lý dữ liệu' });
  }
});

app.get('/', (req, res) => {
  res.send('API Dự đoán Tài Xỉu đang hoạt động. Truy cập /ketqua để xem kết quả.');
});

app.listen(PORT, () => {
  console.log(`✅ Server chạy tại: http://localhost:${PORT}`);
});
