/// <reference path="jquery/jquery.d.ts"/>

interface Form {
	// init
	(method = "init", options): void
	// message
	(method = "message", content, type): void
}

interface FormOptions {
	data: (data:any)=>any
	validation: ValidationOptions
	target: string
	method: string
	result: (error:Error, data:any, xhr:XMLHttpRequest)=>void | ResultOptions | JQuery
	succeed: (data:any)=>void 
	failed: (error:Error)=>void 
}

interface ValidationOptions {
	events: {
		validate: string
		invalidate: string
	}
	styles: {
		ok: string
		warning: string
		error: string
		nok: string
		nwarning: string
		nerror: string
		neutral: string
	}
	icons: {
		selector: string
		template: string
		ok: string
		warning: string
		error: string
		nok: string
		nwarning: string
		nerror: string
	}
	rules: {
		[key:string]: Rule
	}
}

interface Rule {
	rule: RegExp | Validate
	message: string
}

interface Validate {
	(val:string, $el:JQuery): string | JQueryDeferred<string>
}

interface ResultOptions {
	$table: JQuery
	$modal: JQuery
}

interface JQuery {
	form: Form
	modal?: Function
	table?: Function
}