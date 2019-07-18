require 'rails_helper'
require 'rspec_api_documentation/dsl'


resource "Comment Votes" do

  explanation "Votes are used to express agreement on content (i.e. comments)."

  before do
    @user = create(:admin)
    token = Knock::AuthToken.new(payload: { sub: @user.id }).token
    header 'Authorization', "Bearer #{token}"
    header "Content-Type", "application/json"
    @project = create(:continuous_project, with_permissions: true)
    @idea = create(:idea, project: @project)
    @comment = create(:comment, idea: @idea)
    @votes = create_list(:vote, 2, votable: @comment)
  end

  get "web_api/v1/comments/:comment_id/votes" do
    let(:comment_id) { @comment.id }

    example_request "List all votes of a comment" do
      expect(status).to eq(200)
      json_response = json_parse(response_body)
      expect(json_response[:data].size).to eq 2
    end
  end

  get "web_api/v1/votes/:id" do
    let(:id) { @votes.first.id }

    example_request "Get one vote on a comment by id" do
      expect(status).to eq 200
      json_response = json_parse(response_body)
      expect(json_response.dig(:data, :id)).to eq @votes.first.id
    end

    example "[error] Get one vote on a comment by id" do
      @user = create(:user)
      token = Knock::AuthToken.new(payload: { sub: @user.id }).token
      header 'Authorization', "Bearer #{token}"

      @votes.first.votable.idea.update!(project: create(:project_with_current_phase))
      do_request
      
      expect(status).to eq 401
    end
  end

  post "web_api/v1/comments/:comment_id/votes" do
    with_options scope: :vote do
      parameter :user_id, "The user id of the user owning the vote. Signed in user by default", required: false
      parameter :mode, "one of [up, down]", required: true
    end
    ValidationErrorHelper.new.error_fields(self, Vote)
  
    let(:comment_id) { @comment.id }
    let(:mode) { "up" }
  
    example_request "Create a vote on a comment" do
      expect(response_status).to eq 201
      json_response = json_parse(response_body)
      expect(json_response.dig(:data,:relationships,:user,:data,:id)).to eq @user.id
      expect(json_response.dig(:data,:attributes,:mode)).to eq "up"
      expect(@comment.reload.upvotes_count).to eq 3
    end
  end

  post "web_api/v1/comments/:comment_id/votes/up" do
    let(:comment_id) { @comment.id }

    example_request "Upvote a comment that doesn't have your vote yet" do
      expect(status).to eq 201
      expect(@comment.reload.upvotes_count).to eq 3
      expect(@comment.reload.downvotes_count).to eq 0
    end

    example "Upvote a comment that you downvoted before" do
      @comment.votes.create(user: @user, mode: 'down')
      do_request
      expect(status).to eq 201
      expect(@comment.reload.upvotes_count).to eq 3
      expect(@comment.reload.downvotes_count).to eq 0
    end

    example "[error] Upvote a comment that you upvoted before" do
      @comment.votes.create(user: @user, mode: 'up')
      do_request
      expect(status).to eq 422
      json_response = json_parse(response_body)
      expect(json_response[:errors][:base][0][:error]).to eq "already_upvoted"
      expect(@comment.reload.upvotes_count).to eq 3
      expect(@comment.reload.downvotes_count).to eq 0
    end
  end

  post "web_api/v1/comments/:comment_id/votes/down" do
    let(:comment_id) { @comment.id }

    example_request "Downvote a comment that doesn't have your vote yet" do
      expect(status).to eq 201
      expect(@comment.reload.upvotes_count).to eq 2
      expect(@comment.reload.downvotes_count).to eq 1
    end

    example "Downvote a comment that you upvoted before" do
      @comment.votes.create(user: @user, mode: 'up')
      do_request
      expect(status).to eq 201
      expect(@comment.reload.upvotes_count).to eq 2
      expect(@comment.reload.downvotes_count).to eq 1
    end

    example "[error] Downvote a comment that you downvoted before" do
      @comment.votes.create(user: @user, mode: 'down')
      do_request
      expect(status).to eq 422
      json_response = json_parse(response_body)
      expect(json_response[:errors][:base][0][:error]).to eq "already_downvoted"
      expect(@comment.reload.upvotes_count).to eq 2
      expect(@comment.reload.downvotes_count).to eq 1
    end
  end

  delete "web_api/v1/votes/:id" do
    let(:vote) { create(:vote, user: @user, votable: @comment) }
    let(:id) { vote.id }
    
    example_request "Delete a vote from a comment" do
      expect(response_status).to eq 200
      expect{Vote.find(id)}.to raise_error(ActiveRecord::RecordNotFound)
    end
  end
end
