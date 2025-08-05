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
      ketQua.push({
        tong: tong,
        ket_qua: ketQuaTuTong(tong)
      });
    }
  }
  return ketQua;
}

app.get('/ketqua', async (req, res) => {
  try {
    const resApi = await axios.get(API_URL);
    const danhSach = resApi.data.data.resultList;

    const phien_hien_tai = danhSach[0].gameNum.replace('#', '');
    const pattern = layPattern(danhSach.slice(1, 21)); // 20 kết quả gần nhất

    const item = danhSach[0];
    const [xx1, xx2, xx3] = item.facesList;
    const tong = item.score;
    const ket_qua = ketQuaTuTong(tong);
    const du_doan = 'Đang phát triển'; // Placeholder
    const doan_vi = tao3DoanVi(tong);

    res.json({
      Phien: item.gameNum,
      Xuc_xac_1: xx1,
      Xuc_xac_2: xx2,
      Xuc_xac_3: xx3,
      Tong: tong,
      Ket_qua: ket_qua,
      Pattern: pattern,
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
  res.send('API dự đoán Tài/Xỉu đang hoạt động! Truy cập /ketqua để xem kết quả.');
});

app.listen(PORT, () => {
  console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
