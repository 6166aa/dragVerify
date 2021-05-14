"use strict";

(function () {
  var fields = {}; //获取远程验证相关信息的函数，交给用户写，通过回调返回{block,background,y,verifyId}
  //即(callback)=>{x.get().then(res=>{var data = res.xxx;callback(data)})};

  var getVerifyInfo = null; //请求远程,获取当前偏移是否正确的函数，交给用户写，通过回调返回{success:true,message:''}
  //即(verifyId,x,callback)=>{xxx.get().then(res=>callback(res))}

  var verify = null;
  var BASE_HTML = '<div class="drag-verify"><div class="drag-verify__button"><div class="drag-verify__icon"></div></div><div class="drag-verify__model"><div class="drag-verify__model-body"><div>拖动下方滑块完成拼图</div><div class="drag-verify__img"><div class="drag-verify__img-background"></div><div class="drag-verify__img-block"></div></div><div class="drag-verify__slider"><div class="drag-verify__slider-background"></div><div class="drag-verify__slider-block"></div></div><div class="drag-verify__footer"><span class="drag-verify__reset">重置</span><span class="drag-verify__close">关闭</span></div></div></div></div>';

  function init(el, option) {
    required(option, ["getVerifyInfo", "verify"]);
    el = document.querySelector(el);
    fields.el = el;
    fields.failCount = 0;
    fields.isDown = false;
    el.innerHTML = BASE_HTML;
    fields.maxFailCount = option.maxFailCount || 3;
    fields.sliderBlock = el.querySelector("[class^=drag-verify__slider-block]");
    fields.sliderBackground = el.querySelector("[class^=drag-verify__slider-background]");
    fields.imgBackground = el.querySelector("[class^=drag-verify__img-background]");
    fields.imgBlock = el.querySelector("[class^=drag-verify__img-block]");
    fields.verifyButton = el.querySelector("[class^=drag-verify__button]");
    fields.verifyModel = el.querySelector("[class^=drag-verify__model]");
    getVerifyInfo = option.getVerifyInfo;
    verify = option.verify;
    fields.verifyButton.addEventListener("click", showVerifyModel);
    el.querySelector("[class^=drag-verify__close]").addEventListener("click", closeVerifyModel);
    fields.sliderBlock.addEventListener("mousedown", mouseDown);
    el.querySelector("[class^=drag-verify__reset]").addEventListener("click", resetVerify);
    document.addEventListener("mouseup", mouseUp);
    document.addEventListener("mousemove", dragBlock);
  }

  function required(option, fields) {
    if (!option) {
      throw Error("option is missing");
    } else {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = fields[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var field = _step.value;

          if (!option[field]) {
            throw Error("option." + field + " is missing");
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator["return"] != null) {
            _iterator["return"]();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }
  }

  function wrapFn(callback) {
    var args = Array.prototype.slice.call(arguments, 1);
    return function (e) {
      callback.apply(this, [e].concat(args));
    };
  }

  function dragBlock(event) {
    if (!fields.isDown) {
      return;
    }

    var offsetX = event.clientX - fields.x;
    offsetX = offsetX < 0 ? 0 : offsetX;
    offsetX = offsetX >= fields.maxOffsetX ? fields.maxOffsetX : offsetX;
    fields.offsetX = offsetX;
    fields.sliderBlock.style.left = offsetX + "px";
    fields.sliderBackground.style.width = offsetX + "px";

    if (offsetX >= fields.maxImgOffsetX) {
      fields.imgBlock.style.left = fields.maxImgOffsetX + "px";
    } else {
      fields.imgBlock.style.left = offsetX + "px";
    }
  }

  function restBlock() {
    fields.sliderBlock.style.left = 0;
    fields.imgBlock.style.left = 0;
    fields.sliderBackground.style.width = 0;
    fields.sliderBlock.className = "drag-verify__slider-block";
    fields.sliderBackground.className = "drag-verify__slider-background";
  }

  function resetVerify() {
    getVerifyInfo(function (data) {
      setVerifyData(data);
      fields.failCount = 0;
      restBlock();
    });
  }

  function setVerifyData(data) {
    fields.failCount = 0;
    fields.imgBlock.style.backgroundImage = "url(" + data.block + ")";
    fields.imgBackground.style.backgroundImage = "url(" + data.background + ")";
    fields.imgBlock.style.top = data.y + "px";
    fields.verifyId = data.verifyId;
  }

  function mouseDown(event) {
    //记录按下时的x坐标点传递给后面函数
    fields.x = event.clientX;
    fields.isDown = true;
    console.log("mouseDown.x", fields.x); //监听移动
  }

  function mouseUp() {
    if (fields.isDown) {
      console.log("mouseup");
      fields.isDown = false; //执行回调

      verify(fields.offsetX, fields.verifyId, function (data) {
        if (data.success) {
          verifySuccess();
        } else {
          verifyFail();
        }
      });
    }
  }

  function showVerifyModel() {
    getVerifyInfo(function (data) {
      setVerifyData(data);
      fields.verifyModel.className = "drag-verify__model--show"; //获取滑块偏移最大范围

      if (!fields.maxOffsetX) {
        fields.maxOffsetX = fields.el.querySelector(".drag-verify__slider").offsetWidth - fields.sliderBlock.offsetWidth;
      } //获取图片拼图最大范围


      if (!fields.maxImgOffsetX) {
        fields.maxImgOffsetX = fields.el.querySelector(".drag-verify__img").offsetWidth - fields.imgBlock.offsetWidth;
      }

      fields.failCount = 0;
    });
  }

  function closeVerifyModel() {
    fields.verifyModel.className = "drag-verify__model";
    restBlock();
  }

  function verifySuccess() {
    fields.verifyButton.className = "drag-verify__button--success";
    fields.sliderBlock.className = "drag-verify__slider-block--success";
    fields.sliderBackground.className = "drag-verify__slider-background--success";
    setTimeout(function () {
      closeVerifyModel();
    }, 1000);
  }

  function verifyFail() {
    fields.verifyButton.className = "drag-verify__button--fail";
    fields.sliderBlock.className = "drag-verify__slider-block--fail";
    fields.sliderBackground.className = "drag-verify__slider-background--fail";
    setTimeout(function () {
      if (++fields.failCount >= fields.maxFailCount) {
        return resetVerify();
      }

      fields.sliderBlock.className = "drag-verify__slider-block";
      fields.sliderBackground.className = "drag-verify__slider-background";
      restBlock();
    }, 1000);
  }

  function isVerified() {
    return !document.querySelector(".drag-verify__button");
  }

  function getOffsetX() {
    return fields.offsetX;
  }

  window.dragVerify = {
    init: init,
    isVerified: isVerified,
    getOffsetX: getOffsetX
  };
})();