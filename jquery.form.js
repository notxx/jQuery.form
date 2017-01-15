/// <reference path="typings/form.d.ts" />
(function($) {
if (!$ || !$.fn) return;
if (!console) // 避免IE下没有console出错
	window.console = { log: function () { } };

/** @param e {Event} */
function submit(e) { // 提交
	e.stopPropagation();
	e.preventDefault();
	var $this = $(this),
		$form = $this.is("form") ? $this : $this.closest("form");
	/** @type {FormOptions} */
	var options = $form.data("form.options");
	if (!validated($form, options)) return;
	var data = options.data.apply($form, [ $form ]); // 产生需要提交的数据
//	return console.log(data);
	$(":input", $form).attr("disabled", true); // 暂时禁用所有输入框
	$.ajax(options.target, {
		data : data,
		method : options.method
	}).then(function(data, textStatus, xhr) {
		$(":input", $form).attr("disabled", false); // 取消输入框禁用
		options.result.apply($this, [ false, data, xhr ]);
	}, function(xhr) {
		$(":input", $form).attr("disabled", false); // 取消输入框禁用
		var data = $.parseJSON(xhr.responseText);
		options.result.apply($this, [ xhr.status, data, xhr ]);
	});
}

/**
 * @param $form {JQuery}
 * @param options {FormOptions}
 * @returns {boolean}
 */
function validated($form, options) {
	// validation
	var result = "neutral";
	$form.find(".form-group").each(function(i, group) {
		var $group = $(group),
			r = validate_group($group, options.validation)();
		if (!r || r === "error") result = "error";
		if (result === "ok" || result === "neutral") result = r;
	});
	return (result !== "error");
}

/** @param e {Event} */
function reset(e) { // 重置
	var $this = $(this),
		$form = $this.is("form") ? $this : $this.closest("form"),
		options = $form.data("form.options"),
		vo = options.validation;
	// validation
	$form.find(".form-group").each(function(i, group) {
		var $group = $(group).data("validated", false),
			$inputs = $group.find(":input");
		$inputs.each(function(j, input) {
			var $input = $(input).data("validated", false),
				$icon = $input.nextUntil(":input").filter(vo.icons.selector).first();
			$icon.remove();
			if ($input.tooltip)
				$input.tooltip("destroy");
			$input.on(vo.events.invalidate, function() {
				$group.data("validated", false);
				$input.data("validated", false);
			});
		});
		$inputs.on(vo.events.validate, validate_group($group, vo));
		$group.removeClass("has-feedback has-success has-warning has-error");
	});
	$form.find("input[type=hidden]").val(""); // 清空hidden域
	if ($.isFunction(options.reset)) { options.reset.apply(this, [ e ]); }
}

/**
 * @param $group {JQuery}
 * @param vo {ValidationOptions}
 */
function validate_group($group, vo) {
	return function(event) {
		var group_result = $group.data("validated");
		if (group_result) return group_result;
		group_result = "neutral";
		var messages = [],
			$inputs = $group.find(":input"),
			styles = vo.styles,
			icons = vo.icons;
		//console.log("validate", $group, group_result);
		$inputs.each(function(j, input) {
			var $input = $(input),
				validation = $input.data("validation"),
				result = $input.data("validated");
			if (!validation) return;
			if (result) {
				if (result === "error" || group_result === "ok" || group_result === "neutral")
					group_result = result;
				return;
			}
			result = "ok";
			if (typeof validation === "string") {
				validation = validation.split(" ");
				$input.data("validation", validation);
			}
			var message = [],
				val = $input.val();
			$.each(validation, function(k, v) {
				var validate = vo.rules[v];
				if (!validate || !validate.rule) return;
				var rule = validate.rule;
				if (rule instanceof RegExp) {
					if (rule.test(val)) return group_result = result;
					group_result = result = "error"; // TODO
					message.push(validate.message);
				} else if (typeof rule === "function" && rule.length === 2) {
					// TODO
				}
			});
			$input.data("validated", result);
			// icon
			var $icon = $input.nextUntil(":input").filter(icons.selector).first(),
				$parent = $input.offsetParent();
			if (!$icon.length)
				$icon = $(icons.template).insertAfter($input);
			$icon.css("right", $parent.outerWidth() - $input.position().left - $input.outerWidth());
			switch (result) {
			case "ok":
				$icon.addClass(icons.ok).removeClass(icons.nok);
				break;
			case "warning":
				$icon.addClass(icons.warning).removeClass(icons.nwarning);
				break;
			case "error":
				$icon.addClass(icons.error).removeClass(icons.nerror);
				break;
			}
			// message
			messages[j] = message = message.join("\r\n");
			//console.log(result, messages);
			$input.attr("title", message);
			if ($input.tooltip) {
				if (message)
					$input.tooltip({ trigger: "manual" }).tooltip("show");
				else
					$input.tooltip("destroy");
			}
		});
		// validated
		$group.data("validated", group_result);
		// style
		switch (group_result) {
		case "neutral":
			$group.removeClass(styles.neutral);
			break;
		case "ok":
			$group.addClass(styles.ok).removeClass(styles.nok);
			break;
		case "warning":
			$group.addClass(styless.warning).removeClass(styles.nwarning);
			break;
		case "error":
			$group.addClass(styles.error).removeClass(styles.nerror);
			break;
		}
		// messages
		var $message = $group.find(".help-block.feedback").empty();
		if ($message.length) { // 没有显示容器就不显示
			var $ul = $('<ul>').appendTo($message);
			$.each(messages, function(k, message) {
				$('<li>').text(message);
			});
		}
		return group_result;
	}
}

/** @param e {JQueryKeyEventObject} */
function keypress(e) { // 将输入中的回车转化为跳至下一个元件
	var $this = $(this), $form = $this.closest("form");
	switch ($this.attr("type")) {
	case "button":
	case "submit":
	case "reset":
		return; // 不在这些元件上转化跳转
	default:
	}
//	console.log(e);
	if (e.keyCode == 13) {
		e.preventDefault(); // 阻止提交
		var focusables = $(":focusable"),
			index = focusables.index(this, $form),
			next = focusables.eq(index + 1).length
				? focusables.eq(index + 1) : focusables.eq(0);
		if (next.is("input[type=submit]")) { return next.click(); } // 直接点击提交
		next.focus();
	}
}

var methods = {};
/**
 * @param options {FormOptions}
 */
methods.init = function(options) {
	var $form = this;
	if (typeof options === "object")
		options = $.extend({}, defaults, options);
	else
		options = $.extend({}, defaults);
	$form.addClass("ui-form")
	.data("form.options", options)
	.on("submit.form", submit)
	.on("reset.form", reset);
	// result
	if ($.isFunction(options.result)) { // check succeed & failed
		if (!$.isFunction(options.succeed))
			options.succeed = $.noop;
		if (!$.isFunction(options.failed))
			options.failed = $.noop;
	} else if (options.result instanceof $) { // JQuery
		if (options.result.is(".ui-table")) { // jQuery.table TODO
			options.result = resulting($form.closest(".modal"), options.result);
		}
	} else {
		/** @type {ResultOptions} */
		var ro = options.result;
		options.result = resulting(ro.$modal || $form.closest(".modal"), ro.$table);
	}
	/**
	 * @param $modal {JQuery}
	 * @param $table {JQuery}
	 */
	function resulting($modal, $table) {
		return (function(error, data, xhr) {
			if ($table && $table.table)
				$table.table("load");
			if ($modal && $modal.modal)
				$modal.modal("hide");
		});
	}
	// validation
	{
		var vo = options.validation,
			styles = vo.styles,
			icons = vo.icons;
		styles.nok = styles.warning + " " + styles.error;
		styles.nwarning = styles.ok + " " + styles.error;
		styles.nerror = styles.ok + " " + styles.warning;
		styles.neutral = styles.ok + " " + styles.warning + " " + styles.error;
		icons.nok = icons.warning + " " + icons.error;
		icons.nwarning = icons.ok + " " + icons.error;
		icons.nerror = icons.ok + " " + icons.warning;
		$form.find(".form-group").each(function(i, group) {
			var $group = $(group),
				$inputs = $group.find(":input"),
				validatee = [];
			if (!$inputs.length) return;
			$inputs.each(function(j, input) {
				var $input = $(input),
					validation = $input.data("validation");
				if (!validation)  return $input.data("validated", true);
				validatee.push(input);
				$input.on(vo.events.invalidate, function() {
					$group.data("validated", false);
					$input.data("validated", false);
				});
			});
			if (!validatee.length) return;
			$group.addClass("has-feedback");
			$(validatee).on(vo.events.validate, validate_group($group, vo));
		});
	}
	// 将按钮转化为bootstrap按钮
	var $buttons = $form.find("input[type=button], input[type=submit], input[type=reset], button").addClass("ui-form-button btn btn-default");
	$buttons.filter("[type=submit]").addClass("btn-primary");
	$buttons.filter("[type=reset]").addClass("btn-danger");
	// 处理按键事件
	$("input", $form).on("keypress", keypress);
};
methods.message = function(content, type) {
	var $form = this;
//	if (console && console.log) {
//		console.log(content, type);
//	} else {
		alert(content, type);
//	}
};

/** @type {FormOptions} */
var defaults = {
		data: function() { return this.serialize(); },
		validation: {
			events: {
				validate: "blur change",
				invalidate: "change"
			},
			styles: {
				ok: "has-success",
				warning: "has-warning",
				error: "has-error",
			},
			icons: {
				selector: "span.glyphicon.form-control-feedback",
				template: '<span class="glyphicon form-control-feedback" aria-hidden="true"></span>',
				ok: "glyphicon-ok",
				warning: "glyphicon-warning-sign",
				error: "glyphicon-remove"
			},
			rules: {
				required: {
					rule: /^.+$/,
					message: "必须填写",
				}
			}
		},
		method: "post",
		/**
		 * @param err {Error}
		 * @param data {any}
		 * @param xhr {XMLHttpRequest}
		 */
		result: function(err, data, xhr) {
			var $this = $(this),
				$form = $this.is("form") ? $this : $this.closest("form");
			/** @type {FormOptions} */
			var options = $form.data("form.options");
			if (err)
				options.failed.call($this, err)
			else
				options.succeed.call($this, data);
		},
		succeed: $.noop,
		failed: $.noop
};

/** @this jQuery */
$.fn.form = function(method) {
	if(!this.length) return this;  // 没必要处理空集合
	var $form = this.is("form") ? this : this.closest("form");
	if (!$form.length) return this;

	if (typeof(method) == 'string' && method.charAt(0) != '_' && methods[method]) {
		// make sure init is called once
		if(method != "message") { methods.init.apply($form); }

		return methods[method].apply($form, Array.prototype.slice.call(arguments, 1));
	} else if (typeof method == 'object' || !method) {
		// default constructor with or without arguments
		methods.init.apply($form, arguments);
	} else {
		$.error('Method ' + method + ' does not exist in jQuery.form');
	}
	return this;
};

})(jQuery);
