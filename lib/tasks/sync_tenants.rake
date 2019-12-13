require 'yaml'


namespace :sync_tenants do

  desc "List updates that may have to be synced"
  task :output_updates, [:hosts] => [:environment] do |t, args|
    template = YAML.load open(Rails.root.join('config', 'tenant_templates', "base.yml")).read
    sheet ||= []

    Tenant.where(host: args[:hosts].split(';')).each do |tenant|
      Apartment::Tenant.switch(tenant.schema_name) do
        template['models'].each do |model_name, fields|
          classname = model_name.classify
          fields.each do |attributes|
            object = object_from_template classname, attributes
            if object.present?
              attributes.each do |field_name, field_value|
                value = if (field_name =~ /_multiloc$/) && (field_value.is_a? String)
                  CL2_SUPPORTED_LOCALES.map do |locale|
                    translation = I18n.with_locale(locale) { I18n.t!(field_value) }
                    [locale, translation]
                  end.to_h
                elsif field_name.end_with?('_ref')
                  nil
                elsif field_name.end_with?('_timediff')
                  nil
                elsif !model_name.include?('image') && field_name.start_with?('remote_') && field_name.end_with?('_url') && !field_name.include?('file')
                  nil
                else
                  field_value
                end
                if value && value_changed(value, object.send(field_name), field_name)
                  sheet += [{
                    'Tenant host'             => tenant.host,
                    'Content type'            => classname,
                    'ID'                      => object.id,
                    'Property'                => field_name,
                    'Changed or customized?'  => object.created_at != object.updated_at,
                    'New value'               => value.to_s,
                    'Old value'               => object.send(field_name)
                  }]
                end
              end
            end
          end
        end
      end
    end

    CSV.open('tmp/requesting_updates.csv', "wb") do |csv|
      csv << sheet.first.keys
      sheet.each do |d|
        csv << d.values
      end
    end
  end

  desc "Apply updates from file"
  task :apply_updates, [:sheet] => [:environment] do |t, args|
    template = YAML.load open(Rails.root.join('config', 'tenant_templates', "base.yml")).read
    instructions = CSV.parse(open(args[:sheet]).read, { headers: true, col_sep: ',', converters: [] })

    Tenant.where(host: instructions.map{|d| d['Tenant host']}.uniq).each do |tenant|
      Apartment::Tenant.switch(tenant.schema_name) do
        template['models'].each do |model_name, fields|
          classname = model_name.classify
          fields.each do |attributes|
            object = object_from_template classname, attributes
            if object.present?
              attributes.each do |field_name, field_value|
                value = if (field_name =~ /_multiloc$/) && (field_value.is_a? String)
                  CL2_SUPPORTED_LOCALES.map do |locale|
                    translation = I18n.with_locale(locale) { I18n.t!(field_value) }
                    [locale, translation]
                  end.to_h
                elsif field_name.end_with?('_ref')
                  nil
                elsif field_name.end_with?('_timediff')
                  nil
                elsif !model_name.include?('image') && field_name.start_with?('remote_') && field_name.end_with?('_url') && !field_name.include?('file')
                  nil
                else
                  field_value
                end
                if value
                  instruction = instructions.find do |d|
                    d['ID'] == object.id && d['Property'] == field_name && d['Tenant host'] == tenant.host && d['Content type'] == classname
                  end
                  if instruction
                    # In a later iteration, we could first try to parse 
                    # the new (string) value provided in the sheet.
                    object.send "#{field_name}=", value
                    object.save!
                  end
                end
              end
            end
          end
        end
      end
    end
  end
end

def object_from_template classname, attributes
  case classname
  when 'IdeaStatus'
    IdeaStatus.where(code: attributes['code']).first unless attributes['code'] == 'custom'
  when 'InitiativeStatus'
    InitiativeStatus.where(code: attributes['code']).first unless attributes['code'] == 'custom'
  when 'Topic'  
    nil
  when 'Page'
    # Problem is that text image urls change
    # Page.where(slug: attributes['slug']).first
    nil
  when 'Project'
    nil
  when 'Event'
    nil
  when 'CustomField'
    CustomField.where(code: attributes['code']).first
  when 'CustomFieldOption'
    CustomFieldOption.where(key: attributes['key'], custom_field: CustomField.where(code: attributes['custom_field_ref']['code'])).first
  else
    nil
  end
end

def value_changed value1, value2, field_name
  if field_name =~ /_multiloc$/
    value1 = value1.stringify_keys
    value2 = value2.stringify_keys
    (value1.keys & value2.keys & Tenant.current.settings.dig('core', 'locales')).any? do |key|
      value1[key] != value2[key]
    end
  elsif field_name == 'ordering'
    # don't consider ordering changes
    false
  else
    value1 != value2
  end
end