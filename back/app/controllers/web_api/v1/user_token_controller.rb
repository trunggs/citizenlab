class WebApi::V1::UserTokenController < ApplicationController
  skip_before_action :authenticate_user
  skip_after_action :verify_authorized

  def create
    @auth = UserAuth.new(auth_params)
    if @auth.valid?
      render json: { token: @auth.token }, status: :created
    else
      render json: { errors: @auth.errors.details }, status: :not_found
    end
  end

  private

  def auth_params
    params.require(:auth).permit(:email, :password, :mobile_phone_number, :mobile_phone_country_code, :auth_method)
  end
end
