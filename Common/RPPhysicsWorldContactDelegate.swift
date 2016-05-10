//
//  RPPhysicsWorldContactDelegate.swift
//  RapunzelSwift
//
//  Created by Simon Kemper on 13.11.15.
//  Copyright © 2015 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

struct RPCollisionCategoryBitMask {
    
    static let Player: UInt32 = 0x02
    static let Star: UInt32 = 0x03
    static let Platform: UInt32 = 0x04
    static let BottomHittablePlatform: UInt32 = 0x05
    static let BreakablePlatform: UInt32 = 0x06
}

protocol ContactableNode {
    func didBeginContact(withNode node: SKNode)
}

protocol ContactNotifiableType {
    
    func contactWithEntityDidBegin(entity: GKEntity)
    func contactWithEntityDidEnd(entity: GKEntity)
}

class RPPhysicsWorldContactDelegate: RPObject, SKPhysicsContactDelegate {
    
    // MARK: SKPhysicsContactDelegate
    
    override init() {
        
        func setupCollisions() {
            
            RPColliderType.definedCollisions[.PlayerBot] = [
                .TaskBot,
                //.NormalPlatform,
                //.BottomCollidablePlatform
            ]
            
            RPColliderType.definedCollisions[.NormalPlatform] = [
                .PlayerBot,
                .TaskBot
            ]
            
            RPColliderType.requestedContactNotifications[.PlayerBot] = [
                .TaskBot,
                .NormalPlatform,
                .BottomCollidablePlatform
            ]
            
            RPColliderType.requestedContactNotifications[.NormalPlatform] = [
                .TaskBot,
                .PlayerBot
            ]
            
            RPColliderType.requestedContactNotifications[.BottomCollidablePlatform] = [
                .TaskBot,
                .PlayerBot
            ]
        }
        
        setupCollisions()
    }
    
    func didBeginContact(contact: SKPhysicsContact) {
        handleContact(contact) { (ContactNotifiableType: ContactNotifiableType, otherEntity: GKEntity) in
            ContactNotifiableType.contactWithEntityDidBegin(otherEntity)
        }
    }
    
    func didEndContact(contact: SKPhysicsContact) {
        handleContact(contact) { (ContactNotifiableType: ContactNotifiableType, otherEntity: GKEntity) in
            ContactNotifiableType.contactWithEntityDidEnd(otherEntity)
        }
    }
    
    // MARK: SKPhysicsContactDelegate convenience
    
    private func handleContact(contact: SKPhysicsContact, contactCallback: (ContactNotifiableType, GKEntity) -> Void) {
        // Get the `ColliderType` for each contacted body.
        let colliderTypeA = RPColliderType(rawValue: contact.bodyA.categoryBitMask)
        let colliderTypeB = RPColliderType(rawValue: contact.bodyB.categoryBitMask)
        
        // Determine which `ColliderType` should be notified of the contact.
        let aWantsCallback = colliderTypeA.notifyOnContactWithColliderType(colliderTypeB)
        let bWantsCallback = colliderTypeB.notifyOnContactWithColliderType(colliderTypeA)
        
        // Make sure that at least one of the entities wants to handle this contact.
        //assert(aWantsCallback || bWantsCallback, "Unhandled physics contact - A = \(colliderTypeA), B = \(colliderTypeB)")
        
        let entityA = (contact.bodyA.node as? RPNode)?.entity
        let entityB = (contact.bodyB.node as? RPNode)?.entity
        
        /*
        If `entityA` is a notifiable type and `colliderTypeA` specifies that it should be notified
        of contact with `colliderTypeB`, call the callback on `entityA`.
        */
        if let notifiableEntity = entityA as? ContactNotifiableType, otherEntity = entityB where aWantsCallback {
            contactCallback(notifiableEntity, otherEntity)
        }
        
        /*
        If `entityB` is a notifiable type and `colliderTypeB` specifies that it should be notified
        of contact with `colliderTypeA`, call the callback on `entityB`.
        */
        if let notifiableEntity = entityB as? ContactNotifiableType, otherEntity = entityA where bWantsCallback {
            contactCallback(notifiableEntity, otherEntity)
        }
    }
}

