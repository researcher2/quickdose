require "csv"

class ApplicationController < ActionController::Base
  include VueHelper

  def dose_calculator
    @module_path, @css = get_module_path("dose_calculator")
  end
end
