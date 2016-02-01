/*
    Copyright (C) 2015 Apple Inc. All Rights Reserved.
    See LICENSE.txt for this sample’s licensing information
    
    Abstract:
    An option set used for categorizing physics bodies in SpriteKit's physics world.
*/

import SpriteKit
import GameplayKit

struct RPColliderType: OptionSetType, Hashable, CustomDebugStringConvertible {
    // MARK: Static properties
    
    /// A dictionary to specify which `ColliderType`s should be notified of contacts with other `ColliderType`s.
    static var requestedContactNotifications = [RPColliderType: [RPColliderType]]()
    
    /// A dictionary of which `ColliderType`s should collide with other `ColliderType`s.
    static var definedCollisions = [RPColliderType: [RPColliderType]]()

    // MARK: Properties
    
    let rawValue: UInt32

    // MARK: Options
    
    static var Obstacle: RPColliderType  { return self.init(rawValue: 1 << 0) }
    static var PlayerBot: RPColliderType { return self.init(rawValue: 1 << 1) }
    static var TaskBot: RPColliderType   { return self.init(rawValue: 1 << 2) }

    // MARK: Hashable
    
    var hashValue: Int {
        return Int(rawValue)
    }
    
    // MARK: CustomDebugStringConvertible
    
    var debugDescription: String {
        switch self.rawValue {
            case RPColliderType.Obstacle.rawValue:
                return "ColliderType.Obstacle"
                
            case RPColliderType.PlayerBot.rawValue:
                return "ColliderType.PlayerBot"
            
            case RPColliderType.TaskBot.rawValue:
                return "ColliderType.TaskBot"
                
            default:
                return "UnknownColliderType(\(self.rawValue))"
        }
    }
    
    // MARK: SpriteKit Physics Convenience
    
    /// A value that can be assigned to a 'SKPhysicsBody`'s `categoryMask` property.
    var categoryMask: UInt32 {
        return rawValue
    }
    
    /// A value that can be assigned to a 'SKPhysicsBody`'s `collisionMask` property.
    var collisionMask: UInt32 {
        // Combine all of the collision requests for this type using a bitwise or.
        let mask = RPColliderType.definedCollisions[self]?.reduce(RPColliderType()) { initial, colliderType in
            return initial.union(colliderType)
        }
        
        // Provide the rawValue of the resulting mask or 0 (so the object doesn't collide with anything).
        return mask?.rawValue ?? 0
    }
    
    /// A value that can be assigned to a 'SKPhysicsBody`'s `contactMask` property.
    var contactMask: UInt32 {
        // Combine all of the contact requests for this type using a bitwise or.
        let mask = RPColliderType.requestedContactNotifications[self]?.reduce(RPColliderType()) { initial, colliderType in
            return initial.union(colliderType)
        }
        
        // Provide the rawValue of the resulting mask or 0 (so the object doesn't need contact callbacks).
        return mask?.rawValue ?? 0
    }

    // MARK: ContactNotifiableType Convenience
    
    /**
        Returns `true` if the `ContactNotifiableType` associated with this `ColliderType` should be
        notified of contact with the passed `ColliderType`.
    */
    func notifyOnContactWithColliderType(colliderType: RPColliderType) -> Bool {
        if let requestedContacts = RPColliderType.requestedContactNotifications[self] {
            return requestedContacts.contains(colliderType)
        }
        
        return false
    }
}
