# frozen_string_literal: true

module CitizenLab
  module Permissions
    module Scopes
      module ParticipationContext
        ACTIONS = {
          'information' => [],
          'ideation' => %w[posting_idea voting_idea commenting_idea],
          'survey' => %w[taking_survey],
          'poll' => %w[taking_poll],
          'budgeting' => %w[commenting_idea budgeting],
          'volunteering' => []
        }.freeze

        # @param [Project, Phase] scope
        def self.actions(scope)
          return ACTIONS.values.flatten unless scope

          ACTIONS[scope.participation_method]
        end

        def self.scope_types
          %w[Project Phase]
        end
      end
    end
  end
end
