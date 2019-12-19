module EmailCampaigns
  class WebApi::V1::ConsentsController < EmailCampaignsController

    before_action :set_consent, only: [:update]

    def index
      authorize Consent
      Consent.create_all_for_user!(current_user_by_unsubscription_token)
      
      @consents = policy_scope(Consent)
        .where(user: current_user_by_unsubscription_token)
        .page(params.dig(:page, :number))
        .per(params.dig(:page, :size))

      render json: linked_json(@consents, WebApi::V1::ConsentSerializer, params: fastjson_params)
    end

    def update
      @consent.assign_attributes consent_params
      authorize @consent
      if @consent.save
        render json: WebApi::V1::ConsentSerializer.new(@consent, params: fastjson_params).serialized_json, status: :ok
      else
        render json: { errors: @consent.errors.details }, status: :unprocessable_entity
      end
    end

    def update_by_campaign_id
      @campaign = Campaign.find(params[:campaign_id])
      @consent = Consent.find_by!(
        campaign_type: @campaign.type,
        user: current_user_by_unsubscription_token
      )
      update
    end


    def current_user_by_unsubscription_token
      token = UnsubscriptionToken.find_by(token: params[:unsubscription_token])
      if token
        token.user
      else
        current_user
      end
    end

    def pundit_user
      current_user_by_unsubscription_token
    end

    def secure_controller?
      false
    end

    private

    def set_consent
      @consent = Consent.find(params[:id])
      authorize @consent
    end

    def consent_params
      params.require(:consent).permit(
        :consented
      )
    end
  end
end
