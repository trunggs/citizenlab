class AddAcceptanceFieldsToUsers < ActiveRecord::Migration[6.0]
  def change
    add_column :users, :terms_and_conditions_accepted, :boolean, default: false
    add_column :users, :privacy_policy_accepted, :boolean, default: false
  end
end
