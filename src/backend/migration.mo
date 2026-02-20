import Map "mo:core/Map";
import Text "mo:core/Text";
import Principal "mo:core/Principal";

module {
  type Section = {
    id : Text;
    title : Text;
    description : Text;
    creator : Text;
    creatorName : Text;
    createdAt : Int;
    linkSharingEnabled : Bool;
  };

  type OldMessage = {
    id : Text;
    sectionId : Text;
    user : Text;
    message : Text;
    createdAt : Int;
  };

  type NewInternalMessage = {
    id : Text;
    sectionId : Text;
    principal : Principal;
    message : Text;
    createdAt : Int;
  };

  type OldActor = {
    sections : Map.Map<Text, Section>;
    messages : Map.Map<Text, OldMessage>;
  };

  type NewActor = {
    sections : Map.Map<Text, Section>;
    messages : Map.Map<Text, NewInternalMessage>;
  };

  public func run(old : OldActor) : NewActor {
    let mappedMessages = old.messages.map<Text, OldMessage, NewInternalMessage>(
      func(_id, oldMessage) {
        {
          id = oldMessage.id;
          sectionId = oldMessage.sectionId;
          principal = Principal.anonymous();
          message = oldMessage.message;
          createdAt = oldMessage.createdAt;
        };
      }
    );
    {
      old with
      messages = mappedMessages;
    };
  };
};
