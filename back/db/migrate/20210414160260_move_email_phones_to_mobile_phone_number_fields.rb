class MoveEmailPhonesToMobilePhoneNumberFields < ActiveRecord::Migration[6.0]
  def change
    return unless AppConfiguration.instance.settings('password_login', 'phone')

    pattern = AppConfiguration.instance.settings('password_login', 'phone_email_pattern')
    pattern_regex = pattern.gsub('__PHONE__', '([0-9]+)')

    User.registered_with_email.where('email ~ ?', pattern_regex).each do |user|
      phone = user.email.match(pattern_regex).first
      user.update(
        mobile_phone_number: phone,
        mobile_phone_country_code: AppConfiguration.instance.country_code,
        registration_method: 'phone',
        email: nil
      )
    end
  end
end
