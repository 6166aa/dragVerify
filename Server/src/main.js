const fs = require("fs");
const path = require("path");
const Koa = require("koa");
const Router = require("koa-router");
const cors = require("koa-cors");
const app = new Koa();
const testRouter = new Router();
//通过一系列操作后台生成两张图片，一个是拼图块，一个是被挖去的图片，及x，y
let array = [
  {
    dragVerifyId: 01,
    x: 140,
    y: 50,
    blockFileId: "10010",
    backgroundFileId: "20010",
  },
  {
    dragVerifyId: 02,
    x: 56,
    y: 10,
    blockFileId: "10011",
    backgroundFileId: "20011",
  },
  {
    dragVerifyId: 03,
    x: 99,
    y: 49,
    blockFileId: "10012",
    backgroundFileId: "20012",
  },
];
let result;
testRouter.get("/dragVerify", (ctx, next) => {
  result = array[Math.floor(Math.random() * array.length)];
  let data = {
    ...result,
  };
  delete data.x;
  ctx.body = data;
});
testRouter.get("/dragVerify/:dragVerifyId", (ctx, next) => {
  let { x } = ctx.request.query;
  var dragVerifyId = ctx.request.params.dragVerifyId;
  let result = array.find(_=>_.dragVerifyId==dragVerifyId);
  if (Math.abs(x - result.x) < 10) {
    // 10以内的误差
    ctx.body = {
      success: true,
      error: "",
    };
  } else {
    ctx.body = {
      success: false,
      error: "未能正确通过滑动验证",
    };
  }
});
testRouter.get("/file/:fileId", (ctx, next) => {
  console.log(ctx.request.params);
  var fileId = ctx.request.params.fileId;
  try {
    ctx.type = "jpg";
    ctx.body = fs.readFileSync(
      path.resolve(__dirname, "./imgs/" + fileId + ".jpg")
    );
  } catch (error) {
    ctx.type = "text";
    ctx.body = "Not Found";
  }
});
app.use(cors());
app.use(testRouter.routes());
app.listen(8999, () => {
  console.log("服务启动成功");
});
