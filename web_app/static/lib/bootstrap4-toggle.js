/*\
|*| ========================================================================
|*| Bootstrap Toggle: bootstrap4-toggle.js v3.7.0
|*| https://gitbrent.github.io/bootstrap4-toggle/
|*| ========================================================================
|*| Copyright 2018-2019 Brent Ely
|*| Licensed under MIT
|*| ========================================================================
\*/

+function ($) {
    'use strict';

   // TOGGLE PUBLIC CLASS DEFINITION
   // ==============================

   var Toggle = function (element, options) {
       this.$element  = $(element)
       this.options   = $.extend({}, this.defaults(), options)
       this.render()
   }

   Toggle.VERSION  = '3.7.0-beta'

   Toggle.DEFAULTS = {
       on: 'On',
       off: 'Off',
       onstyle: 'primary',
       offstyle: 'light',
       size: 'normal',
       style: '',
       width: null,
       height: null
   }

   Toggle.prototype.defaults = function() {
       return {
           on: this.$element.attr('data-on') || Toggle.DEFAULTS.on,
           off: this.$element.attr('data-off') || Toggle.DEFAULTS.off,
           onstyle: this.$element.attr('data-onstyle') || Toggle.DEFAULTS.onstyle,
           offstyle: this.$element.attr('data-offstyle') || Toggle.DEFAULTS.offstyle,
           size: this.$element.attr('data-size') || Toggle.DEFAULTS.size,
           style: this.$element.attr('data-style') || Toggle.DEFAULTS.style,
           width: this.$element.attr('data-width') || Toggle.DEFAULTS.width,
           height: this.$element.attr('data-height') || Toggle.DEFAULTS.height
       }
   }

   Toggle.prototype.render = function () {
       this._onstyle = 'btn-' + this.options.onstyle
       this._offstyle = 'btn-' + this.options.offstyle
       var size
           = this.options.size === 'large' || this.options.size === 'lg' ? 'btn-lg'
           : this.options.size === 'small' || this.options.size === 'sm' ? 'btn-sm'
           : this.options.size === 'mini'  || this.options.size === 'xs' ? 'btn-xs'
           : ''
       var $toggleOn = $('<label for="'+ this.$element.prop('id') +'" class="btn">').html(this.options.on)
           .addClass(this._onstyle + ' ' + size)
       var $toggleOff = $('<label for="'+ this.$element.prop('id') +'" class="btn">').html(this.options.off)
           .addClass(this._offstyle + ' ' + size)
       var $toggleHandle = $('<span class="toggle-handle btn btn-light">')
           .addClass(size)
       var $toggleGroup = $('<div class="toggle-group">')
           .append($toggleOn, $toggleOff, $toggleHandle)
       var $toggle = $('<div class="toggle btn" data-toggle="toggle" role="button">')
           .addClass( this.$element.prop('checked') ? this._onstyle : this._offstyle+' off' )
           .addClass(size).addClass(this.options.style)

       this.$element.wrap($toggle)
       $.extend(this, {
           $toggle: this.$element.parent(),
           $toggleOn: $toggleOn,
           $toggleOff: $toggleOff,
           $toggleGroup: $toggleGroup
       })
       this.$toggle.append($toggleGroup)

       var width = this.options.width || Math.max($toggleOn.outerWidth(), $toggleOff.outerWidth())+($toggleHandle.outerWidth()/2)
       var height = this.options.height || Math.max($toggleOn.outerHeight(), $toggleOff.outerHeight())
       $toggleOn.addClass('toggle-on')
       $toggleOff.addClass('toggle-off')
       this.$toggle.css({ width: width, height: height })
       if (this.options.height) {
           $toggleOn.css('line-height', $toggleOn.height() + 'px')
           $toggleOff.css('line-height', $toggleOff.height() + 'px')
       }
       this.update(true)
       this.trigger(true)
   }

   Toggle.prototype.toggle = function () {
       if (this.$element.prop('checked')) this.off()
       else this.on()
   }

   Toggle.prototype.on = function (silent) {
       if (this.$element.prop('disabled')) return false
       this.$toggle.removeClass(this._offstyle + ' off').addClass(this._onstyle)
       this.$element.prop('checked', true)
       if (!silent) this.trigger()
   }

   Toggle.prototype.setOnStyle = function (style) {
        if (this.$element.prop('checked')) {
            var ToggleOn = this.$toggle.parent().find('.toggle-on');
            ToggleOn.removeClass(this._onstyle);
            //removing onstyle class on outline
            this.$toggle.removeClass(this._onstyle)
            // set new onstyle
            this.options.onstyle = style;
            this._onstyle = 'btn-' + this.options.onstyle;
            // now adding back new onstyle class ...
            // on label
            ToggleOn.addClass(this._onstyle)
            // on outline
            this.$toggle.addClass(this._onstyle);
        }
        else {
            // only set new onstyle
            this.options.onstyle = style;
            this._onstyle = 'btn-' + this.options.onstyle;
        }
    }

    Toggle.prototype.setOffStyle = function (style) {
        if (!this.$element.prop('checked')) {
            var ToggleOff = this.$toggle.parent().find('.toggle-off');
            ToggleOff.removeClass(this._offstyle);
            //removing offstyle class on outline
            this.$toggle.removeClass(this._offstyle)
            // set new offstyle
            this.options.offstyle = style;
            this._offstyle = 'btn-' + this.options.offstyle;
            // now adding back new offstyle class ...
            // on label
            ToggleOff.addClass(this._offstyle)
            // on outline
            this.$toggle.addClass(this._offstyle);
        }
        else {
            // only set new offstyle
            this.options.offstyle = style;
            this._offstyle = 'btn-' + this.options.offstyle;
        }
     }

   Toggle.prototype.off = function (silent) {
       if (this.$element.prop('disabled')) return false
       this.$toggle.removeClass(this._onstyle).addClass(this._offstyle + ' off')
       this.$element.prop('checked', false)
       if (!silent) this.trigger()
   }

   Toggle.prototype.enable = function () {
       this.$toggle.removeClass('disabled')
       this.$toggle.removeAttr('disabled')
       this.$element.prop('disabled', false)
   }

   Toggle.prototype.disable = function () {
       this.$toggle.addClass('disabled')
       this.$toggle.attr('disabled', 'disabled')
       this.$element.prop('disabled', true)
   }
   
   Toggle.prototype.update = function (silent) {
       if (this.$element.prop('disabled')) this.disable()
       else this.enable()
       if (this.$element.prop('checked')) this.on(silent)
       else this.off(silent)
   }

   Toggle.prototype.trigger = function (silent) {
       this.$element.off('change.bs.toggle')
       if (!silent) this.$element.change()
       this.$element.on('change.bs.toggle', $.proxy(function() {
           this.update()
       }, this))
   }

   Toggle.prototype.destroy = function() {
       this.$element.off('change.bs.toggle')
       this.$toggleGroup.remove()
       this.$element.removeData('bs.toggle')
       this.$element.unwrap()
   }

   // TOGGLE PLUGIN DEFINITION
   // ========================

   function Plugin(option) {
       var optArg = Array.prototype.slice.call( arguments, 1 )[0]

       return this.each(function () {
           var $this   = $(this)
           var data    = $this.data('bs.toggle')
           var options = typeof option == 'object' && option

           if (!data) $this.data('bs.toggle', (data = new Toggle(this, options)))
           if (typeof option === 'string' && data[option] && (typeof optArg === 'boolean' || typeof optArg === 'string')) data[option](optArg)
           else if (typeof option === 'string' && data[option]) data[option]()
           //else if (option && !data[option]) console.log('bootstrap-toggle: error: method `'+ option +'` does not exist!');
       })
   }

   var old = $.fn.bootstrapToggle

   $.fn.bootstrapToggle             = Plugin
   $.fn.bootstrapToggle.Constructor = Toggle

   // TOGGLE NO CONFLICT
   // ==================

   $.fn.toggle.noConflict = function () {
       $.fn.bootstrapToggle = old
       return this
   }

   // TOGGLE DATA-API
   // ===============

   $(function() {
       $('input[type=checkbox][data-toggle^=toggle]').bootstrapToggle()
   })

   $(document).on('click.bs.toggle', 'div[data-toggle^=toggle]', function(e) {
       var $checkbox = $(this).find('input[type=checkbox]')
       $checkbox.bootstrapToggle('toggle')
       e.preventDefault()
   })
}(jQuery);