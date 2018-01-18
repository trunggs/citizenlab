require 'csv'
require 'open-uri'

### rake cl2_back:import_ideas['http://res.cloudinary.com/citizenlabco/raw/upload/v1516117361/CitizenLab_import_template_Sint-Niklaas_1_.xlsx_-_Overmolen_nligii.csv','sint-niklaas.citizenlab.co'] ###


namespace :cl2_back do
  desc "Imports ideas from a csv file, as specified by the path argument, into the tenant specified by the host."
  task :import_ideas, [:url,:host] => [:environment] do |t, args|
  	host = args[:host]
    Apartment::Tenant.switch(host.gsub '.', '_') do
    	idea_models_data = ii_read_csv(args).map{ |csv_idea| ii_convert_idea(csv_idea) }
      ImportIdeasService.new.import_ideas idea_models_data
    end
  end

  def ii_read_csv args
  	CSV.read(open(args[:url]), { headers: true, col_sep: ',', converters: [] })
  end

  def ii_convert_idea csv_idea
  	d = {}
  	d[:title]         = csv_idea['Title']
  	d[:body]          = csv_idea['Body']
  	d[:topic_titles]  = (csv_idea['Topics'] || '').split(';').select{ |topic| topic }
  	d[:project_title] = csv_idea['Project']
  	d[:user_email]    = csv_idea['Email']
    d[:image_url]     = csv_idea['Image URL']
    d[:phase_rank]   = csv_idea['Phase']
  	d
  end

end