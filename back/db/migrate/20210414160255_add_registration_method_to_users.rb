class AddRegistrationMethodToUsers < ActiveRecord::Migration[6.0]
  def change
    add_column :users, :registration_method, :string, default: 'email', null: false
  end
end
