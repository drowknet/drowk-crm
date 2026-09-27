# Gmail connector scope

Gmail is a source/evidence connector.

Rules:
- preserve source IDs and history cursor/watermark;
- observation precedes promotion;
- Draft != Sent; Sent != Delivered; From=owner is not proof of SENT;
- Spam != commercial irrelevance;
- history expiration must trigger bounded recovery;
- outbound authority is separate from read/sync authority;
- uncertain send outcomes require ActionAttempt reconciliation.
