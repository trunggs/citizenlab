class UserAuth
  include ActiveModel::Model

  attr_accessor :email, :password, :mobile_phone_country_code, :mobile_phone_number, :mobile_phone, :user, :token

  def initialize(attributes = {})
    @email                     = attributes[:email]
    @password                  = attributes[:password]
    @mobile_phone_country_code = attributes[:mobile_phone_country_code]
    @mobile_phone_number       = attributes[:mobile_phone_number]
    @auth_method               = attributes[:auth_method]
  end

  class<< self
    def create(attributes = {})
      new(attributes).yield_self do |auth|
        auth.valid? && auth
      end
    end
  end

  def valid?
    validate!
    errors.empty?
  end

  def token
    AuthToken.new(payload: user.to_token_payload)
  end

  def validate!
    if auth_method == 'mobile_phone'
      validate_mobile_phone
    elsif auth_method == 'email'
      validate_email
    end
    validate_password if errors.empty?
  end

  def validate_mobile_phone
    unless @user = User.find_by(mobile_phone_number: mobile_phone_number, mobile_phone_country_code: mobile_phone_country_code)
      errors.add(:base, :invalid_credentials, message: 'Invalid credentials.')
    end
  end

  def validate_email
    unless @user = User.find_by_cimail(email)
      errors.add(:base, :invalid_credentials, message: 'Invalid credentials.')
    end
  end

  def validate_password
    unless @user.authenticate(password)
      errors.add(:base, :invalid_credentials, message: 'Invalid credentials.')
    end
  end

  def auth_method
    return @auth_method   if @auth_method
    return 'mobile_phone' if mobile_phone_number && mobile_phone_country_code && phone_auth_enabled?

    'email'
  end

  def phone_auth_enabled?
    AppConfiguration.instance.settings('password_login', 'phone')
  end
end
