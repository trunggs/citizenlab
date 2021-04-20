class SetCountryCodeToAppConfiguration < ActiveRecord::Migration[6.0]
  def up
    return unless AppConfiguration.instance_exists?
    return if AppConfiguration.instance.settings('core', 'country_code')

    map_center_coordinates = AppConfiguration.instance.settings('maps', 'map_center').values_at('lat', 'lng')
    cc = Geocoder.search(map_center_coordinates).first&.country_code

    return unless cc

    AppConfiguration.instance.update_core_setting('country_code', cc)
  end
end
