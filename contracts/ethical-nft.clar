;; ProvenancePulse Ethical NFT Contract
;; Clarity v2 (compatible with Stacks 2.1+, using latest syntax as of 2025)
;; Implements NFT minting, transfer with verification, metadata updates, admin controls, and events
;; Supports SIP-009-like traits for NFTs with added ethical provenance features
;; Metadata includes ethical certifications, artisan details, sustainability metrics, and narrative URIs

(define-trait nft-trait
  (
    (get-last-token-id () (response uint uint))
    (get-token-uri (uint) (response (optional (string-ascii 256)) uint))
    (get-owner (uint) (response (optional principal) uint))
    (transfer (uint principal principal) (response bool uint))
  )
)

(define-constant ERR-NOT-AUTHORIZED u100)
(define-constant ERR-NOT-OWNER u101)
(define-constant ERR-INVALID-TOKEN u102)
(define-constant ERR-PAUSED u103)
(define-constant ERR-ZERO-ADDRESS u104)
(define-constant ERR-METADATA-FROZEN u105)
(define-constant ERR-VERIFICATION-FAILED u106)
(define-constant ERR-INVALID-METADATA u107)
(define-constant ERR-TOKEN-ALREADY-EXISTS u108)
(define-constant ERR-INVALID-URI u109)

;; Contract metadata
(define-constant CONTRACT-NAME "ProvenancePulse Ethical NFT")
(define-constant CONTRACT-SYMBOL "PPENFT")

;; Admin and state variables
(define-data-var admin principal tx-sender)
(define-data-var paused bool false)
(define-data-var last-token-id uint u0)
(define-data-var metadata-frozen bool false) ;; Once frozen, metadata can't be updated

;; Maps for NFT data
(define-map owners uint principal) ;; token-id -> owner
(define-map approvals uint principal) ;; token-id -> approved spender (for transferFrom-like)
(define-map metadata uint
  {
    ethical-cert: (string-ascii 128), ;; e.g., "Fair Trade Certified"
    artisan-details: (string-utf8 256), ;; Artisan name, location, story
    sustainability-metrics: (tuple (carbon-footprint uint) (water-usage uint) (recycled-percent uint)), ;; Metrics
    narrative-uri: (optional (string-ascii 256)), ;; URI to full story
  }
)

;; Private helper: is-admin
(define-private (is-admin)
  (is-eq tx-sender (var-get admin))
)

;; Private helper: ensure not paused
(define-private (ensure-not-paused)
  (asserts! (not (var-get paused)) (err ERR-PAUSED))
)

;; Private helper: validate principal
(define-private (validate-principal (addr principal))
  (not (is-eq addr 'SP000000000000000000002Q6VF78))
)

;; Private helper: validate URI
(define-private (validate-uri (uri (optional (string-ascii 256))))
  (match uri
    some-uri (and (> (len some-uri) u0) (<= (len some-uri) u256))
    true ;; None is valid
  )
)

;; Private helper: emit event (using print for logging/events)
(define-private (emit-event (event-name (string-ascii 64)) (data (tuple (token-id uint) (from principal) (to principal) (extra (optional (string-ascii 256))))))
  (print { event: event-name, data: data })
)

;; Transfer admin rights
(define-public (transfer-admin (new-admin principal))
  (begin
    (asserts! (is-admin) (err ERR-NOT-AUTHORIZED))
    (asserts! (validate-principal new-admin) (err ERR-ZERO-ADDRESS))
    (var-set admin new-admin)
    (ok true)
  )
)

;; Pause/unpause the contract
(define-public (set-paused (pause bool))
  (begin
    (asserts! (is-admin) (err ERR-NOT-AUTHORIZED))
    (var-set paused pause)
    (ok pause)
  )
)

;; Freeze metadata updates permanently
(define-public (freeze-metadata)
  (begin
    (asserts! (is-admin) (err ERR-NOT-AUTHORIZED))
    (asserts! (not (var-get metadata-frozen)) (err ERR-METADATA-FROZEN))
    (var-set metadata-frozen true)
    (ok true)
  )
)

;; Mint a new ethical NFT
(define-public (mint (recipient principal)
                     (ethical-cert (string-ascii 128))
                     (artisan-details (string-utf8 256))
                     (carbon-footprint uint)
                     (water-usage uint)
                     (recycled-percent uint)
                     (narrative-uri (optional (string-ascii 256))))
  (begin
    (asserts! (is-admin) (err ERR-NOT-AUTHORIZED)) ;; Admin mints; later integrate with oracle
    (ensure-not-paused)
    (asserts! (validate-principal recipient) (err ERR-ZERO-ADDRESS))
    ;; Validate metadata
    (asserts! (> (len ethical-cert) u0) (err ERR-INVALID-METADATA))
    (asserts! (> (len artisan-details) u0) (err ERR-INVALID-METADATA))
    (asserts! (<= recycled-percent u100) (err ERR-INVALID-METADATA))
    (asserts! (validate-uri narrative-uri) (err ERR-INVALID-URI))
    (let ((new-id (+ (var-get last-token-id) u1)))
      (asserts! (is-none (map-get? owners new-id)) (err ERR-TOKEN-ALREADY-EXISTS))
      (map-set owners new-id recipient)
      (map-set metadata new-id
        {
          ethical-cert: ethical-cert,
          artisan-details: artisan-details,
          sustainability-metrics: { carbon-footprint: carbon-footprint, water-usage: water-usage, recycled-percent: recycled-percent },
          narrative-uri: narrative-uri
        }
      )
      (var-set last-token-id new-id)
      (emit-event "mint" { token-id: new-id, from: tx-sender, to: recipient, extra: none })
      (ok new-id)
    )
  )
)

;; Transfer NFT with verification
(define-public (transfer (token-id uint) (recipient principal))
  (begin
    (ensure-not-paused)
    (asserts! (validate-principal recipient) (err ERR-ZERO-ADDRESS))
    (asserts! (> token-id u0) (err ERR-INVALID-TOKEN))
    (match (map-get? owners token-id)
      owner
      (begin
        (asserts! (or (is-eq tx-sender owner) (is-eq tx-sender (default-to 'SP000000000000000000002Q6VF78 (map-get? approvals token-id)))) (err ERR-NOT-OWNER))
        (map-set owners token-id recipient)
        (map-delete approvals token-id)
        (emit-event "transfer" { token-id: token-id, from: owner, to: recipient, extra: none })
        (ok true)
      )
      (err ERR-INVALID-TOKEN)
    )
  )
)

;; Approve a spender for a token
(define-public (approve (token-id uint) (spender principal))
  (begin
    (ensure-not-paused)
    (asserts! (> token-id u0) (err ERR-INVALID-TOKEN))
    (asserts! (validate-principal spender) (err ERR-ZERO-ADDRESS))
    (match (map-get? owners token-id)
      owner
      (begin
        (asserts! (is-eq tx-sender owner) (err ERR-NOT-OWNER))
        (map-set approvals token-id spender)
        (emit-event "approve" { token-id: token-id, from: tx-sender, to: spender, extra: none })
        (ok true)
      )
      (err ERR-INVALID-TOKEN)
    )
  )
)
