export default function JobInsights({ protocol, profile }: any) {
  if (!protocol?.female_risk_summary) return null;

  return (
    <div className="px-5 mb-4">
      <div className="bg-white border border-border rounded-3xl px-5 py-4">
        <p className="text-xs text-gold uppercase tracking-widest font-medium mb-3">
          Job Intelligence
        </p>

        {/* Her job */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-2 h-2 rounded-full bg-purple-400 flex-shrink-0 mt-1.5" />
          <div>
            <p className="text-xs text-muted font-medium mb-0.5">
              Your job · {profile.job_type}
            </p>
            <p className="text-sm text-charcoal leading-relaxed">
              {protocol.female_risk_summary}
            </p>
          </div>
        </div>

        {/* Partner job */}
        {protocol.male_risk_summary && (
          <div className="flex items-start gap-3 mb-3">
            <div className="w-2 h-2 rounded-full bg-teal-400 flex-shrink-0 mt-1.5" />
            <div>
              <p className="text-xs text-muted font-medium mb-0.5">
                Partner's job
              </p>
              <p className="text-sm text-charcoal leading-relaxed">
                {protocol.male_risk_summary}
              </p>
            </div>
          </div>
        )}

        {/* Baby focus */}
        {protocol.baby_focus && (
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-gold flex-shrink-0 mt-1.5" />
            <div>
              <p className="text-xs text-muted font-medium mb-0.5">
                Baby development
              </p>
              <p className="text-sm text-charcoal leading-relaxed">
                {protocol.baby_focus}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
