import Map "mo:core/Map";
import Set "mo:core/Set";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Array "mo:core/Array";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Storage "blob-storage/Storage";
import Stripe "stripe/stripe";
import AccessControl "authorization/access-control";
import OutCall "http-outcalls/outcall";
import UserApproval "user-approval/approval";
import MixinAuthorization "authorization/MixinAuthorization";
import MixinStorage "blob-storage/Mixin";

actor {
  include MixinStorage();

  type BeatCategory = {
    #hipHop;
    #pop;
    #rock;
    #electronic;
    #lofi;
  };

  type BeatStyle = {
    #oldSchool;
    #modern;
    #experimental;
    #trap;
    #jazzInfluence;
    #classic;
  };

  type BeatTexture = {
    #smooth;
    #gritty;
    #melodic;
    #upbeat;
  };

  public type RightsType = {
    #basicRight;
    #premiumRight;
    #exclusiveRight;
    #stems;
  };

  type AudioFileType = {
    #mp3;
    #wav;
    #stems;
  };

  type LicenseDocType = {
    #pdf;
    #docx;
    #txt;
    #folder;
  };

  type CoverArtType = {
    #jpg;
    #png;
    #webp;
  };

  type PreviewType = {
    #audio;
    #video;
  };

  public type GuestSession = {
    purchases : List.List<Text>;
    verified : Bool;
  };

  public type AudioFileEntry = {
    fileType : AudioFileType;
    assetId : Text;
    reference : Storage.ExternalBlob;
    description : ?Text;
  };

  public type LicenseDocEntry = {
    docType : LicenseDocType;
    assetId : Text;
    reference : Storage.ExternalBlob;
    description : ?Text;
  };

  public type CoverArtEntry = {
    fileType : CoverArtType;
    assetId : Text;
    reference : Storage.ExternalBlob;
    description : ?Text;
  };

  public type PreviewEntry = {
    previewType : PreviewType;
    assetId : Text;
    reference : Storage.ExternalBlob;
    duration : Nat;
    description : ?Text;
  };

  public type DeliveryMethod = {
    #zipFiles;
    #googleDrive;
  };

  public type RightsFolder = {
    rightsType : RightsType;
    priceInCents : Nat;
    freeDownload : Bool;
    sold : Bool;
    audioFiles : [AudioFileEntry];
    licenseDocs : [LicenseDocEntry];
    zipFile : ?Storage.ExternalBlob;
    googleDriveLink : ?Text;
  };

  public type Beat = {
    id : Text;
    title : Text;
    artist : Text;
    category : BeatCategory;
    style : BeatStyle;
    texture : BeatTexture;
    coverArt : [CoverArtEntry];
    preview : PreviewEntry;
    rightsFolders : [RightsFolder];
    deliveryMethod : DeliveryMethod;
    approved : Bool;
  };

  module Beat {
    public func compare(beat1 : Beat, beat2 : Beat) : Order.Order {
      Text.compare(beat1.title, beat2.title);
    };
  };

  var beats : Map.Map<Text, Beat> = Map.empty();
  var beatsEntries : [(Text, Beat)] = [];
  var basicRightsLicenseStore : ?Storage.ExternalBlob = null;
  var premiumRightsLicenseStore : ?Storage.ExternalBlob = null;
  var exclusiveRightsLicenseStore : ?Storage.ExternalBlob = null;
  var stemsRightsLicenseStore : ?Storage.ExternalBlob = null;

  public type Mixtape = {
    id : Text;
    title : Text;
    artistName : Text;
    description : Text;
    coverArt : ?Storage.ExternalBlob;
    songs : [Storage.ExternalBlob];
    externalLinks : [Text];
    approved : Bool;
    uploader : Principal;
  };

  type ShowcaseHighlight = {
    mixtapeId : Text;
    highlightedSong : Storage.ExternalBlob;
    artistName : Text;
  };

  var mixtapes : Map.Map<Text, Mixtape> = Map.empty();
  var mixtapesEntries : [(Text, Mixtape)] = [];
  var showcaseHighlights : Map.Map<Text, ShowcaseHighlight> = Map.empty();
  let maxSongs = 20;

  system func preupgrade() {
    beatsEntries := beats.entries().toArray();
    mixtapesEntries := mixtapes.entries().toArray();
  };

  system func postupgrade() {
    beats := Map.fromIter<Text, Beat>(beatsEntries.vals());
    beatsEntries := [];
    mixtapes := Map.fromIter<Text, Mixtape>(mixtapesEntries.vals());
    mixtapesEntries := [];
  };

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let approvalState = UserApproval.initState(accessControlState);

  public query ({ caller }) func isCallerApproved() : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can check approval status");
    };
    AccessControl.hasPermission(accessControlState, caller, #admin) or UserApproval.isApproved(approvalState, caller);
  };

  public shared ({ caller }) func requestApproval() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can request approval");
    };
    UserApproval.requestApproval(approvalState, caller);
  };

  public shared ({ caller }) func setApproval(user : Principal, status : UserApproval.ApprovalStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.setApproval(approvalState, user, status);
  };

  public query ({ caller }) func listApprovals() : async [UserApproval.UserApprovalInfo] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    UserApproval.listApprovals(approvalState);
  };

  public type UserProfile = {
    name : Text;
    isCreator : Bool;
  };

  let userProfiles : Map.Map<Principal, UserProfile> = Map.empty();

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can access profiles");
    };
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  public type BeatFilter = {
    category : ?BeatCategory;
    style : ?BeatStyle;
    texture : ?BeatTexture;
  };

  public query func getBeats() : async [Beat] {
    beats.values().toArray().sort();
  };

  public query func filterBeats(filter : BeatFilter) : async [Beat] {
    beats.values().toArray().sort().filter(
      func(beat) {
        var matches = true;
        switch (filter.category, filter.style, filter.texture) {
          case (?category, _, _) {
            matches := matches and (category == beat.category);
          };
          case (_, ?style, _) {
            matches := matches and (style == beat.style);
          };
          case (_, _, ?texture) {
            matches := matches and (texture == beat.texture);
          };
          case (null, null, null) {};
        };
        matches;
      }
    );
  };

  public shared ({ caller }) func uploadBeat(
    id : Text,
    title : Text,
    artist : Text,
    category : BeatCategory,
    style : BeatStyle,
    texture : BeatTexture,
    coverArt : [CoverArtEntry],
    preview : PreviewEntry,
    rightsFolders : [RightsFolder],
    deliveryMethod : DeliveryMethod,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can upload beats");
    };

    let beat : Beat = {
      id;
      title;
      artist;
      category;
      style;
      texture;
      coverArt;
      preview;
      rightsFolders;
      deliveryMethod;
      approved = true;
    };

    beats.add(id, beat);
  };

  public shared ({ caller }) func updateBeat(
    id : Text,
    title : Text,
    artist : Text,
    category : BeatCategory,
    style : BeatStyle,
    texture : BeatTexture,
    coverArt : [CoverArtEntry],
    preview : PreviewEntry,
    rightsFolders : [RightsFolder],
    deliveryMethod : DeliveryMethod,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update beats");
    };
    switch (beats.get(id)) {
      case (null) { Runtime.trap("Beat not found") };
      case (?_) {
        let updatedBeat = {
          id;
          title;
          artist;
          category;
          style;
          texture;
          coverArt;
          preview;
          rightsFolders;
          deliveryMethod;
          approved = true;
        };
        beats.add(id, updatedBeat);
      };
    };
  };

  public shared ({ caller }) func deleteBeat(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete beats");
    };
    beats.remove(id);
  };

  public query func getBeat(id : Text) : async ?Beat {
    beats.get(id);
  };

  let purchases = Map.empty<Principal, [Text]>();
  let guestSessions = Map.empty<Text, GuestSession>();

  func hasPurchasedBeat(user : Principal, beatId : Text) : Bool {
    switch (purchases.get(user)) {
      case (null) { false };
      case (?userPurchases) {
        userPurchases.find(func(id) { id == beatId }) != null;
      };
    };
  };

  func hasGuestPurchasedBeat(sessionId : Text, beatId : Text) : Bool {
    switch (guestSessions.get(sessionId)) {
      case (null) { false };
      case (?session) {
        let purchasesArray = session.purchases.toArray();
        purchasesArray.find(func(id) { id == beatId }) != null;
      };
    };
  };

  func recordPurchase(user : Principal, beatId : Text) {
    switch (purchases.get(user)) {
      case (null) {
        purchases.add(user, [beatId]);
      };
      case (?userPurchases) {
        let updated = [beatId].concat(userPurchases);
        purchases.add(user, updated);
      };
    };
  };

  func recordGuestPurchase(sessionId : Text, beatId : Text) {
    switch (guestSessions.get(sessionId)) {
      case (null) {
        let newSession : GuestSession = {
          purchases = List.empty<Text>();
          verified = true;
        };
        newSession.purchases.add(beatId);
        guestSessions.add(sessionId, newSession);
      };
      case (?session) {
        session.purchases.add(beatId);
        guestSessions.add(sessionId, session);
      };
    };
  };

  public query ({ caller }) func getPurchaseHistory() : async [Text] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can view purchase history");
    };
    switch (purchases.get(caller)) {
      case (null) { [] };
      case (?userPurchases) { userPurchases };
    };
  };

  public query ({ caller }) func verifyBeatPurchase(beatId : Text, sessionId : ?Text) : async Bool {
    if (AccessControl.isAdmin(accessControlState, caller)) {
      return true;
    };

    if (AccessControl.hasPermission(accessControlState, caller, #user)) {
      return hasPurchasedBeat(caller, beatId);
    };

    switch (sessionId) {
      case (?id) { hasGuestPurchasedBeat(id, beatId) };
      case (null) { false };
    };
  };

  public query func verifyGuestBeatPurchase(sessionId : Text, beatId : Text) : async Bool {
    switch (guestSessions.get(sessionId)) {
      case (null) { false };
      case (?session) {
        session.verified and hasGuestPurchasedBeat(sessionId, beatId);
      };
    };
  };

  var stripeConfig : ?Stripe.StripeConfiguration = null;

  public query func isStripeConfigured() : async Bool {
    stripeConfig != null;
  };

  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can set Stripe configuration");
    };
    stripeConfig := ?config;
  };

  func getStripeConfiguration() : Stripe.StripeConfiguration {
    switch (stripeConfig) {
      case (null) { Runtime.trap("Stripe needs to be first configured") };
      case (?config) { config };
    };
  };

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    if (items.size() == 1 and items[0].priceInCents == 0) {
      return "";
    };

    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Authentication required for paid purchases");
    };

    let checkoutUrl = await Stripe.createCheckoutSession(getStripeConfiguration(), caller, items, successUrl, cancelUrl, transform);

    if (checkoutUrl == "") {
      Runtime.trap("Stripe session failed: Unable to create checkout session");
    };

    checkoutUrl;
  };

  public shared ({ caller }) func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    await Stripe.getSessionStatus(getStripeConfiguration(), sessionId, transform);
  };

  func isRightsAlreadySold(beat : Beat, rightsType : RightsType) : Bool {
    let rights = beat.rightsFolders.find(func(folder) { folder.rightsType == rightsType });
    switch (rights) {
      case (null) {
        Runtime.trap("Rights not found for this beat");
      };
      case (?rights) { rights.sold };
    };
  };

  func getRightsFolder(beat : Beat, rightsType : RightsType) : RightsFolder {
    let rights = beat.rightsFolders.find(func(folder) { folder.rightsType == rightsType });
    switch (rights) {
      case (null) {
        Runtime.trap("Rights not found for this beat");
      };
      case (?rights) { rights };
    };
  };

  func shouldBlockNewPurchase(rightsType : RightsType) : Bool {
    rightsType == #exclusiveRight;
  };

  public shared ({ caller }) func recordBeatPurchase(
    beatId : Text,
    sessionId : Text,
    isFree : Bool,
    rightsType : RightsType,
  ) : async () {
    let isAuthenticatedUser = AccessControl.hasPermission(accessControlState, caller, #user);
    let isGuest = not isAuthenticatedUser;

    if (isGuest and sessionId == "") {
      Runtime.trap("Unauthorized: Valid session ID required for guest purchases");
    };

    switch (beats.get(beatId)) {
      case (null) { Runtime.trap("Beat not found") };
      case (?beat) {
        if (shouldBlockNewPurchase(rightsType) and isRightsAlreadySold(beat, rightsType)) {
          Runtime.trap("Selected rights have already been sold");
        };

        let rightsFolder = getRightsFolder(beat, rightsType);

        switch (isFree) {
          case (true) {
            if (not rightsFolder.freeDownload) {
              Runtime.trap("Unauthorized: These rights are not available for free download");
            };

            if (isAuthenticatedUser) {
              recordPurchase(caller, beatId);
            } else {
              recordGuestPurchase(sessionId, beatId);
            };

            let _ = updateRightsSoldStatus(beat, beatId, rightsType);
          };
          case (false) {
            switch (stripeConfig) {
              case (null) {
                Runtime.trap("Stripe not configured");
              };
              case (?config) {
                let sessionStatus = await Stripe.getSessionStatus(config, sessionId, transform);

                switch (sessionStatus) {
                  case (#completed stripeSession) {
                    switch (stripeSession.userPrincipal) {
                      case (?userPrincipal) {
                        let purchaserPrincipal = Principal.fromText(userPrincipal);

                        if (isAuthenticatedUser and purchaserPrincipal != caller) {
                          Runtime.trap("Unauthorized: Payment session does not match authenticated user");
                        };

                        recordPurchase(purchaserPrincipal, beatId);

                        let _ = updateRightsSoldStatus(beat, beatId, rightsType);
                      };
                      case (null) {
                        if (isAuthenticatedUser) {
                          Runtime.trap("Unauthorized: Authenticated users must have principal in payment session");
                        };

                        recordGuestPurchase(sessionId, beatId);

                        let _ = updateRightsSoldStatus(beat, beatId, rightsType);
                      };
                    };
                  };
                  case (#failed { error }) {
                    Runtime.trap("Payment not completed: Cannot record purchase - " # error);
                  };
                };
              };
            };
          };
        };
      };
    };
  };

  func updateRightsSoldStatus(beat : Beat, beatId : Text, rightsType : RightsType) : Bool {
    switch (rightsType) {
      case (#exclusiveRight) {
        var updated = false;
        let rightsFolders = beat.rightsFolders.map(
          func(rights) {
            if (rights.rightsType == rightsType) {
              updated := true;
              { rights with sold = true };
            } else { rights };
          }
        );
        if (updated) {
          beats.add(beatId, { beat with rightsFolders });
        };
        updated;
      };
      case (#basicRight or #premiumRight or #stems) { false };
    };
  };

  public shared ({ caller }) func unmarkRightsAsSold(beatId : Text, rightsType : RightsType) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can unmark rights as sold");
    };

    switch (beats.get(beatId)) {
      case (null) { Runtime.trap("Beat not found") };
      case (?beat) {
        let rightsFolders = beat.rightsFolders.map(
          func(rights) {
            if (rights.rightsType == rightsType) {
              { rights with sold = false };
            } else { rights };
          }
        );
        beats.add(beatId, { beat with rightsFolders });
      };
    };
  };

  public shared ({ caller }) func getRightsZipFile(
    beatId : Text,
    rightsType : RightsType,
    sessionId : ?Text,
  ) : async ?Storage.ExternalBlob {
    switch (beats.get(beatId)) {
      case (null) { Runtime.trap("Beat not found") };
      case (?beat) {
        if (beat.deliveryMethod != #zipFiles) {
          Runtime.trap("Rights ZIP file is not available for GDrive link beats");
        };

        let item = beat.rightsFolders.find(func(rights) { rights.rightsType == rightsType });
        switch (item) {
          case (null) { Runtime.trap("Requested rights not found") };
          case (?rights) {
            if (AccessControl.isAdmin(accessControlState, caller)) {
              return rights.zipFile;
            };

            if (AccessControl.hasPermission(accessControlState, caller, #user)) {
              if (not hasPurchasedBeat(caller, beatId)) {
                Runtime.trap("Access denied: Rights to this file not purchased");
              };
              return rights.zipFile;
            };

            switch (sessionId) {
              case (?id) {
                if (not hasGuestPurchasedBeat(id, beatId)) {
                  Runtime.trap("Access denied: Rights to this file not purchased");
                };
                return rights.zipFile;
              };
              case (null) {
                Runtime.trap("Access denied: Session ID required for guest access");
              };
            };
          };
        };
      };
    };
  };

  public shared ({ caller }) func getGoogleDriveLink(
    beatId : Text,
    rightsType : RightsType,
    sessionId : ?Text,
  ) : async ?Text {
    switch (beats.get(beatId)) {
      case (null) { Runtime.trap("Beat not found") };
      case (?beat) {
        switch (beat.deliveryMethod) {
          case (#googleDrive) {
            let item = beat.rightsFolders.find(func(rights) { rights.rightsType == rightsType });
            switch (item) {
              case (null) { Runtime.trap("Requested rights not found") };
              case (?rights) {
                if (AccessControl.isAdmin(accessControlState, caller)) {
                  return rights.googleDriveLink;
                };

                if (AccessControl.hasPermission(accessControlState, caller, #user)) {
                  if (not hasPurchasedBeat(caller, beatId)) {
                    Runtime.trap("Access denied: Rights to this file not purchased");
                  };
                  return rights.googleDriveLink;
                };

                switch (sessionId) {
                  case (?id) {
                    if (not hasGuestPurchasedBeat(id, beatId)) {
                      Runtime.trap("Access denied: Rights to this file not purchased");
                    };
                    return rights.googleDriveLink;
                  };
                  case (null) {
                    Runtime.trap("Access denied: Session ID required for guest access");
                  };
                };
              };
            };
          };
          case (_) { Runtime.trap("Google Drive link is not available for ZIP file beats") };
        };
      };
    };
  };

  public shared ({ caller }) func getLicenseFiles(
    beatId : Text,
    rightsType : RightsType,
    sessionId : ?Text,
  ) : async [Storage.ExternalBlob] {
    if (AccessControl.isAdmin(accessControlState, caller)) {
      let license = switch (rightsType) {
        case (#basicRight) { basicRightsLicenseStore };
        case (#premiumRight) { premiumRightsLicenseStore };
        case (#exclusiveRight) { exclusiveRightsLicenseStore };
        case (#stems) { stemsRightsLicenseStore };
      };

      switch (license) {
        case (null) { [] };
        case (?asset) { [asset] };
      };
    } else if (AccessControl.hasPermission(accessControlState, caller, #user)) {
      if (not hasPurchasedBeat(caller, beatId)) {
        Runtime.trap("Access denied: Rights to this file not purchased");
      };

      let license = switch (rightsType) {
        case (#basicRight) { basicRightsLicenseStore };
        case (#premiumRight) { premiumRightsLicenseStore };
        case (#exclusiveRight) { exclusiveRightsLicenseStore };
        case (#stems) { stemsRightsLicenseStore };
      };

      switch (license) {
        case (null) { [] };
        case (?asset) { [asset] };
      };
    } else {
      switch (sessionId) {
        case (?id) {
          if (not hasGuestPurchasedBeat(id, beatId)) {
            Runtime.trap("Access denied: Rights to this file not purchased");
          };

          let license = switch (rightsType) {
            case (#basicRight) { basicRightsLicenseStore };
            case (#premiumRight) { premiumRightsLicenseStore };
            case (#exclusiveRight) { exclusiveRightsLicenseStore };
            case (#stems) { stemsRightsLicenseStore };
          };

          switch (license) {
            case (null) { [] };
            case (?asset) { [asset] };
          };
        };
        case (null) {
          Runtime.trap("Access denied: Session ID required for guest access");
        };
      };
    };
  };

  public type Showcase = {
    id : Text;
    songName : Text;
    artistName : Text;
    category : BeatCategory;
    style : BeatStyle;
    texture : BeatTexture;
    beatId : ?Text;
    audioFile : Storage.ExternalBlob;
    coverArt : ?Storage.ExternalBlob;
    externalLink : ?Text;
    approved : Bool;
  };

  let showcases = Map.empty<Text, Showcase>();

  module Showcase {
    public func compareByArtist(showcase1 : Showcase, showcase2 : Showcase) : Order.Order {
      Text.compare(showcase1.artistName, showcase2.artistName);
    };
  };

  public shared ({ caller }) func submitShowcase(
    id : Text,
    songName : Text,
    artistName : Text,
    category : BeatCategory,
    style : BeatStyle,
    texture : BeatTexture,
    beatId : ?Text,
    audioFile : Storage.ExternalBlob,
    coverArt : ?Storage.ExternalBlob,
    externalLink : ?Text,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can submit showcases");
    };

    let isApproved = UserApproval.isApproved(approvalState, caller);
    let isAdmin = AccessControl.hasPermission(accessControlState, caller, #admin);

    if (not (isApproved or isAdmin)) {
      Runtime.trap("Unauthorized: Registration must be completed before submitting showcases");
    };

    if (not isAdmin) {
      switch (beatId) {
        case (?beatId) {
          if (not hasPurchasedBeat(caller, beatId)) {
            Runtime.trap("Unauthorized: You must purchase the beat before submitting a showcase");
          };
        };
        case (null) {};
      };
    };

    let showcase : Showcase = {
      id;
      songName;
      artistName;
      category;
      style;
      texture;
      beatId;
      audioFile;
      coverArt;
      externalLink;
      approved = false;
    };
    showcases.add(id, showcase);
  };

  public shared ({ caller }) func approveShowcase(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can approve showcases");
    };
    switch (showcases.get(id)) {
      case (null) { Runtime.trap("Showcase not found") };
      case (?showcase) {
        let updatedShowcase = { showcase with approved = true };
        showcases.add(id, updatedShowcase);
      };
    };
  };

  public shared ({ caller }) func approveAllShowcases() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can approve showcases");
    };
    showcases.keys().forEach(
      func(id) {
        switch (showcases.get(id)) {
          case (null) {};
          case (?showcase) {
            let updatedShowcase = { showcase with approved = true };
            showcases.add(id, updatedShowcase);
          };
        };
      }
    );
  };

  public shared ({ caller }) func deleteShowcase(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete showcases");
    };
    showcases.remove(id);
  };

  public query func getApprovedShowcases() : async [Showcase] {
    showcases.values().toArray().filter(
      func(showcase) {
        showcase.approved;
      }
    ).sort(Showcase.compareByArtist);
  };

  public query ({ caller }) func getPendingShowcases() : async [Showcase] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view pending showcases");
    };
    showcases.values().toArray().filter(
      func(showcase) {
        not showcase.approved;
      }
    ).sort(Showcase.compareByArtist);
  };

  type LiveStream = {
    id : Text;
    host : Text;
    title : Text;
    description : Text;
    isActive : Bool;
  };

  let liveStreams = Map.empty<Text, LiveStream>();

  public shared ({ caller }) func startLiveStream(id : Text, host : Text, title : Text, description : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can start live streams");
    };

    let stream : LiveStream = {
      id;
      host;
      title;
      description;
      isActive = true;
    };
    liveStreams.add(id, stream);
  };

  public shared ({ caller }) func endLiveStream(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can end live streams");
    };
    switch (liveStreams.get(id)) {
      case (null) { Runtime.trap("Live stream not found") };
      case (?stream) {
        let updatedStream = { stream with isActive = false };
        liveStreams.add(id, updatedStream);
      };
    };
  };

  public shared ({ caller }) func endAllLiveStreams() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can end all live streams");
    };
    liveStreams.keys().forEach(
      func(id) {
        switch (liveStreams.get(id)) {
          case (null) {};
          case (?stream) {
            let updatedStream = { stream with isActive = false };
            liveStreams.add(id, updatedStream);
          };
        };
      }
    );
  };

  public query func getActiveLiveStreams() : async [LiveStream] {
    liveStreams.values().toArray().filter(
      func(stream) {
        stream.isActive;
      }
    );
  };

  var mvaPreview : ?Storage.ExternalBlob = null;

  public shared ({ caller }) func uploadMvaPreview(reference : Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can upload M.v.A. previews");
    };
    mvaPreview := ?reference;
  };

  public query func getMvaPreview() : async ?Storage.ExternalBlob {
    mvaPreview;
  };

  public shared ({ caller }) func deleteMvaPreview() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete M.v.A. previews");
    };
    mvaPreview := null;
  };

  public type MusicLink = {
    title : Text;
    platform : Platform;
    url : Text;
    coverArt : ?Storage.ExternalBlob;
    releaseDate : ?Text;
  };

  public type Platform = {
    #spotify;
    #appleMusic;
    #youtube;
    #soundcloud;
    #other : Text;
  };

  var musicLinks = Map.empty<Text, MusicLink>();

  public shared ({ caller }) func addMusicLink(title : Text, platform : Platform, url : Text, releaseDate : ?Text, coverArt : ?Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add music links");
    };

    let musicLink : MusicLink = {
      title;
      platform;
      url;
      coverArt;
      releaseDate;
    };

    musicLinks.add(title, musicLink);
  };

  public query func getMusicLinks() : async [MusicLink] {
    musicLinks.values().toArray();
  };

  public shared ({ caller }) func updateMusicLink(title : Text, platform : Platform, url : Text, releaseDate : ?Text, coverArt : ?Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update music links");
    };

    let musicLink : MusicLink = {
      title;
      platform;
      url;
      coverArt;
      releaseDate;
    };

    musicLinks.add(title, musicLink);
  };

  public shared ({ caller }) func deleteMusicLink(title : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete music links");
    };
    musicLinks.remove(title);
  };

  public query func processOutcall(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  type RedirectState = {
    url : Text;
    timestamp : Nat;
  };

  var redirectState = Map.empty<Principal, RedirectState>();

  public shared ({ caller }) func setRedirectUrl(url : Text) : async () {
    let state : RedirectState = {
      url;
      timestamp = 0;
    };
    redirectState.add(caller, state);
  };

  public query ({ caller }) func getRedirectUrl() : async ?Text {
    switch (redirectState.get(caller)) {
      case (?state) { ?state.url };
      case (null) { null };
    };
  };

  public shared ({ caller }) func clearRedirectUrl() : async () {
    redirectState.remove(caller);
  };

  var featuredBeat : ?Text = null;

  public query func getFeaturedBeat() : async ?Beat {
    switch (featuredBeat, beats) {
      case (null, _) { null };
      case (?beatId, _) {
        beats.get(beatId);
      };
    };
  };

  public shared ({ caller }) func setFeaturedBeat(beatId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can set the featured beat");
    };

    switch (beats.get(beatId)) {
      case (null) { Runtime.trap("Beat not found - cannot set featured beat") };
      case (?_) {
        featuredBeat := ?beatId;
      };
    };
  };

  public shared ({ caller }) func clearFeaturedBeat() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can clear the featured beat");
    };
    featuredBeat := null;
  };

  public type Show = {
    title : Text;
    date : Text;
    time : Text;
    description : Text;
  };

  public type Replay = {
    title : Text;
    description : Text;
    replayUrl : Text;
  };

  var shows = Map.empty<Text, Show>();
  var replays = Map.empty<Text, Replay>();

  public shared ({ caller }) func addUpcomingShow(
    id : Text,
    title : Text,
    date : Text,
    time : Text,
    description : Text,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add upcoming shows");
    };
    let show : Show = {
      title;
      date;
      time;
      description;
    };
    shows.add(id, show);
  };

  public query func getUpcomingShows() : async [Show] {
    shows.values().toArray();
  };

  public shared ({ caller }) func updateUpcomingShow(
    id : Text,
    title : Text,
    date : Text,
    time : Text,
    description : Text,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update upcoming shows");
    };
    switch (shows.get(id)) {
      case (null) { Runtime.trap("Show not found") };
      case (?_) {
        let updatedShow : Show = {
          title;
          date;
          time;
          description;
        };
        shows.add(id, updatedShow);
      };
    };
  };

  public shared ({ caller }) func deleteUpcomingShow(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete upcoming shows");
    };
    shows.remove(id);
  };

  public shared ({ caller }) func addReplay(
    id : Text,
    title : Text,
    description : Text,
    replayUrl : Text,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add replays");
    };
    let replay : Replay = {
      title;
      description;
      replayUrl;
    };
    replays.add(id, replay);
  };

  public query func getReplays() : async [Replay] {
    replays.values().toArray();
  };

  public shared ({ caller }) func updateReplay(
    id : Text,
    title : Text,
    description : Text,
    replayUrl : Text,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update replays");
    };
    switch (replays.get(id)) {
      case (null) { Runtime.trap("Replay not found") };
      case (?_) {
        let updatedReplay = {
          title;
          description;
          replayUrl;
        };
        replays.add(id, updatedReplay);
      };
    };
  };

  public shared ({ caller }) func deleteReplay(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete replays");
    };
    replays.remove(id);
  };

  public type Section = {
    id : Text;
    title : Text;
    description : Text;
    creator : Text;
    creatorName : Text;
    createdAt : Int;
    linkSharingEnabled : Bool;
  };

  public type InternalMessage = {
    id : Text;
    sectionId : Text;
    principal : Principal;
    message : Text;
    createdAt : Int;
  };

  public type Message = {
    id : Text;
    sectionId : Text;
    principal : Principal;
    authorName : ?Text;
    message : Text;
    createdAt : Int;
  };

  public type SectionResponse = {
    section : Section;
    messages : [Message];
  };

  var sections = Map.empty<Text, Section>();
  var messages = Map.empty<Text, InternalMessage>();

  public query func getSections() : async [Section] {
    sections.values().toArray();
  };

  public query func getManySections(ids : [Text]) : async [Section] {
    let result = List.empty<Section>();

    for (id in ids.values()) {
      switch (sections.get(id)) {
        case (null) { () };
        case (?section) { result.add(section) };
      };
    };

    result.toArray();
  };

  public query func getSection(id : Text) : async ?Section {
    sections.get(id);
  };

  public shared ({ caller }) func createSection(
    id : Text,
    title : Text,
    description : Text,
    linkSharingEnabled : Bool,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create sections");
    };

    let section : Section = {
      id;
      title;
      description;
      creator = "admin";
      creatorName = "admin";
      createdAt = Time.now();
      linkSharingEnabled;
    };

    sections.add(id, section);
  };

  public shared ({ caller }) func deleteSection(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete sections");
    };
    sections.remove(id);
  };

  public shared ({ caller }) func setSectionLinkSharing(id : Text, enabled : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update link sharing");
    };

    switch (sections.get(id)) {
      case (null) { Runtime.trap("Section not found") };
      case (?section) {
        let updatedSection = { section with linkSharingEnabled = enabled };
        sections.add(id, updatedSection);
      };
    };
  };

  public shared ({ caller }) func addMessage(sectionId : Text, id : Text, message : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can post messages");
    };

    switch (sections.get(sectionId)) {
      case (null) {
        Runtime.trap("Section not found");
      };
      case (?_) {
        let msg : InternalMessage = {
          id;
          sectionId;
          principal = caller;
          message;
          createdAt = Time.now();
        };

        messages.add(id, msg);
      };
    };
  };

  public shared ({ caller }) func deleteMessage(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete messages");
    };
    messages.remove(id);
  };

  public query ({ caller }) func getMessages(sectionId : Text) : async [Message] {
    messages.values().toArray().filter(
      func(msg) { msg.sectionId == sectionId }
    ).map(
      func(internalMsg) {
        let authorName = userProfiles.get(internalMsg.principal).map(func(profile) { profile.name });
        {
          id = internalMsg.id;
          sectionId = internalMsg.sectionId;
          principal = internalMsg.principal;
          authorName;
          message = internalMsg.message;
          createdAt = internalMsg.createdAt;
        };
      }
    );
  };

  public query func getSectionLinkSharing(id : Text) : async Bool {
    switch (sections.get(id)) {
      case (null) { false };
      case (?section) { section.linkSharingEnabled };
    };
  };

  type MessageUpdate = {
    id : Text;
    updatedContent : Text;
  };

  public shared ({ caller }) func bulkUpdateMessages(messageUpdates : [MessageUpdate]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update messages");
    };

    for (update in messageUpdates.values()) {
      switch (messages.get(update.id)) {
        case (?existingMsg) {
          let updatedMsg = { existingMsg with message = update.updatedContent };
          messages.add(update.id, updatedMsg);
        };
        case (null) {
          Runtime.trap("Message with ID " # update.id # " does not exist");
        };
      };
    };
  };

  public type Milestone = {
    title : Text;
    date : Text;
    description : Text;
    media : ?Storage.ExternalBlob;
    order : Nat;
  };

  var milestones = Map.empty<Text, Milestone>();

  public shared ({ caller }) func saveMilestone(id : Text, milestone : Milestone) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can save milestones");
    };
    let itemWithOrder = { milestone with order = milestone.order };
    milestones.add(id, itemWithOrder);
  };

  public query func getMilestones() : async [Milestone] {
    milestones.values().toArray().sort(
      func(a, b) { Nat.compare(a.order, b.order) }
    );
  };

  public shared ({ caller }) func deleteMilestone(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete milestones");
    };
    milestones.remove(id);
  };

  public shared ({ caller }) func updateMilestoneOrder(milestoneIds : [(Text, Nat)]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update milestone order");
    };

    for ((id, order) in milestoneIds.values()) {
      switch (milestones.get(id)) {
        case (null) {};
        case (?milestone) {
          let updatedMilestone = { milestone with order };
          milestones.add(id, updatedMilestone);
        };
      };
    };
  };

  public shared ({ caller }) func uploadBasicRightsLicense(license : Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can upload the M.v.A Basic Rights license");
    };
    basicRightsLicenseStore := ?license;
  };

  public query func getBasicRightsLicense() : async ?Storage.ExternalBlob {
    basicRightsLicenseStore;
  };

  public shared ({ caller }) func updateBasicRightsLicense(license : Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update the M.v.A Basic Rights license");
    };
    basicRightsLicenseStore := ?license;
  };

  public shared ({ caller }) func deleteBasicRightsLicense() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete the M.v.A Basic Rights license");
    };
    basicRightsLicenseStore := null;
  };

  public shared ({ caller }) func uploadPremiumRightsLicense(license : Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can upload the Premium Rights license");
    };
    premiumRightsLicenseStore := ?license;
  };

  public query func getPremiumRightsLicense() : async ?Storage.ExternalBlob {
    premiumRightsLicenseStore;
  };

  public shared ({ caller }) func updatePremiumRightsLicense(license : Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update the Premium Rights license");
    };
    premiumRightsLicenseStore := ?license;
  };

  public shared ({ caller }) func deletePremiumRightsLicense() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete the Premium Rights license");
    };
    premiumRightsLicenseStore := null;
  };

  public shared ({ caller }) func uploadExclusiveRightsLicense(license : Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can upload the Exclusive Rights license");
    };
    exclusiveRightsLicenseStore := ?license;
  };

  public query func getExclusiveRightsLicense() : async ?Storage.ExternalBlob {
    exclusiveRightsLicenseStore;
  };

  public shared ({ caller }) func updateExclusiveRightsLicense(license : Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update the Exclusive Rights license");
    };
    exclusiveRightsLicenseStore := ?license;
  };

  public shared ({ caller }) func deleteExclusiveRightsLicense() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete the Exclusive Rights license");
    };
    exclusiveRightsLicenseStore := null;
  };

  public shared ({ caller }) func uploadStemsRightsLicense(license : Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can upload the Stems Rights license");
    };
    stemsRightsLicenseStore := ?license;
  };

  public query func getStemsRightsLicense() : async ?Storage.ExternalBlob {
    stemsRightsLicenseStore;
  };

  public shared ({ caller }) func updateStemsRightsLicense(license : Storage.ExternalBlob) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update the Stems Rights license");
    };
    stemsRightsLicenseStore := ?license;
  };

  public shared ({ caller }) func deleteStemsRightsLicense() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete the Stems Rights license");
    };
    stemsRightsLicenseStore := null;
  };

  public type DailyVisit = {
    date : Text;
    count : Nat;
  };

  public type PageVisits = {
    store : Nat;
    showcase : Nat;
    mva : Nat;
    live : Nat;
    forum : Nat;
    musicLinks : Nat;
    mixtapes : Nat;
  };

  public type PageType = {
    #store;
    #showcase;
    #mva;
    #live;
    #forum;
    #musicLinks;
    #mixtapes;
  };

  public type AnalyticsData = {
    totalVisits : Nat;
    uniqueVisitors : Nat;
    dailyVisits : [DailyVisit];
    pageVisits : PageVisits;
  };

  var analytics : AnalyticsData = {
    totalVisits = 0;
    uniqueVisitors = 0;
    dailyVisits = [];
    pageVisits = {
      store = 0;
      showcase = 0;
      mva = 0;
      live = 0;
      forum = 0;
      musicLinks = 0;
      mixtapes = 0;
    };
  };

  let excludedVisitors = Set.empty<Principal>();

  public shared ({ caller }) func addExcludedVisitor(principal : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    excludedVisitors.add(principal);
  };

  public shared ({ caller }) func removeExcludedVisitor(principal : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    excludedVisitors.remove(principal);
  };

  public query ({ caller }) func isExcludedVisitor(principal : Principal) : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    excludedVisitors.contains(principal);
  };

  public query ({ caller }) func getExcludedVisitors() : async [Principal] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    excludedVisitors.toArray();
  };

  public query ({ caller }) func getAnalytics() : async AnalyticsData {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    analytics;
  };

  public shared ({ caller }) func recordSiteVisit(page : PageType) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can record site visits");
    };

    if (not excludedVisitors.contains(caller)) {
      analytics := {
        analytics with
        totalVisits = analytics.totalVisits + 1;
        dailyVisits = [];
        pageVisits = updatePageVisits(page, getPageVisitCountInternal(page) + 1);
      };
    };
  };

  func updatePageVisits(pageType : PageType, pageCount : Nat) : PageVisits {
    switch (pageType) {
      case (#store) { { analytics.pageVisits with store = pageCount } };
      case (#showcase) { { analytics.pageVisits with showcase = pageCount } };
      case (#mva) { { analytics.pageVisits with mva = pageCount } };
      case (#live) { { analytics.pageVisits with live = pageCount } };
      case (#forum) { { analytics.pageVisits with forum = pageCount } };
      case (#musicLinks) {
        { analytics.pageVisits with musicLinks = pageCount };
      };
      case (#mixtapes) {
        { analytics.pageVisits with mixtapes = pageCount };
      };
    };
  };

  func getPageVisitCountInternal(page : PageType) : Nat {
    switch (page) {
      case (#store) { analytics.pageVisits.store };
      case (#showcase) { analytics.pageVisits.showcase };
      case (#mva) { analytics.pageVisits.mva };
      case (#live) { analytics.pageVisits.live };
      case (#forum) { analytics.pageVisits.forum };
      case (#musicLinks) { analytics.pageVisits.musicLinks };
      case (#mixtapes) { analytics.pageVisits.mixtapes };
    };
  };

  func hasDeepRightsType(rightsFolders : [RightsFolder], rightsType : RightsType) : Bool {
    let item = rightsFolders.find(func(rights) { rights.rightsType == rightsType });
    switch (item) {
      case (null) { false };
      case (?_) { true };
    };
  };

  public query func canGetBasicRightsWithLicense(beatId : Text) : async Bool {
    switch (beats.get(beatId)) {
      case (null) { false };
      case (?beat) {
        switch (basicRightsLicenseStore) {
          case (null) { false };
          case (?_) {
            beat.deliveryMethod == #zipFiles and hasDeepRightsType(beat.rightsFolders, #basicRight);
          };
        };
      };
    };
  };

  public query func canGetPremiumRightsWithLicense(beatId : Text) : async Bool {
    switch (beats.get(beatId)) {
      case (null) { false };
      case (?beat) {
        switch (premiumRightsLicenseStore) {
          case (null) { false };
          case (?_) {
            beat.deliveryMethod == #zipFiles and hasDeepRightsType(beat.rightsFolders, #premiumRight);
          };
        };
      };
    };
  };

  public query func canGetExclusiveRightsWithLicense(beatId : Text) : async Bool {
    switch (beats.get(beatId)) {
      case (null) { false };
      case (?beat) {
        switch (exclusiveRightsLicenseStore) {
          case (null) { false };
          case (?_) {
            beat.deliveryMethod == #zipFiles and hasDeepRightsType(beat.rightsFolders, #exclusiveRight);
          };
        };
      };
    };
  };

  public query func canGetStemsRightsWithLicense(beatId : Text) : async Bool {
    switch (beats.get(beatId)) {
      case (null) { false };
      case (?beat) {
        switch (stemsRightsLicenseStore) {
          case (null) { false };
          case (?_) {
            beat.deliveryMethod == #zipFiles and hasDeepRightsType(beat.rightsFolders, #stems);
          };
        };
      };
    };
  };

  type MixtapeSubmissionFeeConfig = {
    enabled : Bool;
    priceInCents : Nat;
  };

  var mixtapeSubmissionFeeConfig : MixtapeSubmissionFeeConfig = {
    enabled = false;
    priceInCents = 0;
  };

  public query func getMixtapeSubmissionFeeConfig() : async MixtapeSubmissionFeeConfig {
    mixtapeSubmissionFeeConfig;
  };

  public shared ({ caller }) func setMixtapeSubmissionFeeConfig(
    enabled : Bool,
    priceInCents : Nat,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can configure the submission fee");
    };
    mixtapeSubmissionFeeConfig := { enabled; priceInCents };
  };

  public shared ({ caller }) func submitMixtape(
    id : Text,
    title : Text,
    artistName : Text,
    description : Text,
    coverArt : ?Storage.ExternalBlob,
    songs : [Storage.ExternalBlob],
    externalLinks : [Text],
    stripeSessionId : ?Text,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can submit mixtapes");
    };

    let isApproved = UserApproval.isApproved(approvalState, caller);
    let isAdmin = AccessControl.hasPermission(accessControlState, caller, #admin);

    if (not (isApproved or isAdmin)) {
      Runtime.trap("Unauthorized: Registration must be completed before submitting mixtapes");
    };

    if (songs.size() > maxSongs) {
      Runtime.trap("Too many songs. The maximum number of songs per mixtape is 20");
    };

    if (mixtapeSubmissionFeeConfig.enabled and not isAdmin) {
      let sessionId = switch (stripeSessionId) {
        case (null) {
          Runtime.trap("Session ID required for paid submissions");
        };
        case (?id) { id };
      };

      switch (stripeConfig) {
        case (null) {
          Runtime.trap("Submission fee: Stripe needs to be first configured");
        };
        case (?config) {
          let sessionStatus = await Stripe.getSessionStatus(config, sessionId, transform);

          switch (sessionStatus) {
            case (#completed _) { () };
            case (#failed { error }) {
              Runtime.trap("Payment not completed: " # error);
            };
          };
        };
      };
    };

    let mixtape : Mixtape = {
      id;
      title;
      artistName;
      description;
      coverArt;
      songs;
      externalLinks;
      approved = false;
      uploader = caller;
    };

    mixtapes.add(id, mixtape);
  };

  public shared ({ caller }) func approveMixtape(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can approve mixtapes");
    };
    switch (mixtapes.get(id)) {
      case (null) { Runtime.trap("Mixtape not found") };
      case (?mixtape) {
        let updatedMixtape = { mixtape with approved = true };
        mixtapes.add(id, updatedMixtape);
      };
    };
  };

  public shared ({ caller }) func rejectMixtape(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can reject mixtapes");
    };
    mixtapes.remove(id);
  };

  public shared ({ caller }) func deleteMixtape(id : Text) : async () {
    let isAdmin = AccessControl.hasPermission(accessControlState, caller, #admin);
    let isUploader = switch (mixtapes.get(id)) {
      case (null) { false };
      case (?mixtape) { mixtape.uploader == caller };
    };

    if (not (isAdmin or isUploader)) {
      Runtime.trap("Unauthorized: Only the uploader or an admin can delete this mixtape");
    };
    mixtapes.remove(id);
    showcaseHighlights.remove(id);
  };

  public query func getApprovedMixtapes() : async [Mixtape] {
    mixtapes.values().toArray().filter(
      func(mixtape) {
        mixtape.approved;
      }
    );
  };

  public query ({ caller }) func getPendingMixtapes() : async [Mixtape] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view pending mixtapes");
    };
    mixtapes.values().toArray().filter(
      func(mixtape) {
        not mixtape.approved;
      }
    );
  };

  public shared ({ caller }) func setShowcaseHighlight(mixtapeId : Text, song : Storage.ExternalBlob, artistName : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can set mixtape highlights");
    };

    let highlight : ShowcaseHighlight = {
      mixtapeId;
      highlightedSong = song;
      artistName;
    };

    showcaseHighlights.add(mixtapeId, highlight);
  };

  public query func getShowcaseHighlights() : async [ShowcaseHighlight] {
    let highlights = showcaseHighlights.values().toArray();
    highlights.sort(
      func(a, b) { Text.compare(a.artistName, b.artistName) }
    );
  };
};

