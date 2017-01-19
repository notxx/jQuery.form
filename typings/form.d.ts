/// <reference path="jquery/jquery.d.ts"/>

interface Form {
	// init
	(method = "init", options:FormOptions): void
	// defaultValues
	(method = "defaultValues", base:any, handler:PropertyHandler): void
	// message
	(method = "message", content:string, type:string): void
}

interface FormOptions {
	data: (data:any)=>any
	validation: ValidationOptions
	target: string
	method: string
	result?: (error:Error, data:any, xhr:XMLHttpRequest)=>void
	succeed?: (data:any)=>void 
	failed?: (error:Error)=>void 
	$table?: JQuery
	$modal?: Boolean | JQuery
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

interface PropertyHandler {
	(key:string, val:string, $el:JQuery): Boolean
}

interface JQuery {
	form: Form
	modal?: Function
	table?: Function
	selectpicker?: Function
}