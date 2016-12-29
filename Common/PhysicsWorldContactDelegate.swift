//
//  PhysicsWorldContactDelegate.swift
//  RapunzelSwift
//
//  Created by Simon Kemper on 13.11.15.
//  Copyright © 2015 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

struct CollisionCategoryBitMask {
    
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
    
    func contactWithEntityDidBegin(_ entity: GKEntity)
    func contactWithEntityDidEnd(_ entity: GKEntity)
}

class PhysicsWorldContactDelegate: NSObject, SKPhysicsContactDelegate {
    
    // MARK: SKPhysicsContactDelegate
    
    override init() {
        
        func setupCollisions() {
            
            ColliderType.definedCollisions[.PlayerBot] = [
                .TaskBot,
                //.NormalPlatform,
                //.BottomCollidablePlatform
            ]
            
            ColliderType.definedCollisions[.NormalPlatform] = [
                .PlayerBot,
                .TaskBot
            ]
            
            ColliderType.requestedContactNotifications[.PlayerBot] = [
                .TaskBot,
                .NormalPlatform,
                .BottomCollidablePlatform
            ]
            
            ColliderType.requestedContactNotifications[.NormalPlatform] = [
                .TaskBot,
                .PlayerBot,
            ]
            
            ColliderType.requestedContactNotifications[.BottomCollidablePlatform] = [
                .TaskBot,
                .PlayerBot
            ]
            
            ColliderType.requestedContactNotifications[.CollectableEntity] = [
                .PlayerBot
            ]
        }
        
        setupCollisions()
    }
    
    func didBegin(_ contact: SKPhysicsContact) {
        handleContact(contact) { (ContactNotifiableType: ContactNotifiableType, otherEntity: GKEntity) in
            ContactNotifiableType.contactWithEntityDidBegin(otherEntity)
        }
    }
    
    func didEnd(_ contact: SKPhysicsContact) {
        handleContact(contact) { (ContactNotifiableType: ContactNotifiableType, otherEntity: GKEntity) in
            ContactNotifiableType.contactWithEntityDidEnd(otherEntity)
        }
    }
    
    // MARK: SKPhysicsContactDelegate convenience
    
    fileprivate func handleContact(_ contact: SKPhysicsContact, contactCallback: (ContactNotifiableType, GKEntity) -> Void) {
        // Get the `ColliderType` for each contacted body.
        let colliderTypeA = ColliderType(rawValue: contact.bodyA.categoryBitMask)
        let colliderTypeB = ColliderType(rawValue: contact.bodyB.categoryBitMask)
        
        // Determine which `ColliderType` should be notified of the contact.
        let aWantsCallback = colliderTypeA.notifyOnContactWithColliderType(colliderTypeB)
        let bWantsCallback = colliderTypeB.notifyOnContactWithColliderType(colliderTypeA)
        
        // Make sure that at least one of the entities wants to handle this contact.
        //assert(aWantsCallback || bWantsCallback, "Unhandled physics contact - A = \(colliderTypeA), B = \(colliderTypeB)")
        
        var entityA: GKEntity?
        var entityB: GKEntity?
        
        if #available(iOS 10.0, *) {
            entityA = ((contact.bodyA.node as? Node)?.entity)!
        } else {
            // Fallback on earlier versions
        }
        if #available(iOS 10.0, *) {
            entityB = ((contact.bodyB.node as? Node)?.entity)!
        } else {
            // Fallback on earlier versions
        }
        
        /*
        If `entityA` is a notifiable type and `colliderTypeA` specifies that it should be notified
        of contact with `colliderTypeB`, call the callback on `entityA`.
        */
        if let notifiableEntity = entityA as? ContactNotifiableType, let otherEntity = entityB , aWantsCallback {
            contactCallback(notifiableEntity, otherEntity)
        }
        
        /*
        If `entityB` is a notifiable type and `colliderTypeB` specifies that it should be notified
        of contact with `colliderTypeA`, call the callback on `entityB`.
        */
        if let notifiableEntity = entityB as? ContactNotifiableType, let otherEntity = entityA , bWantsCallback {
            contactCallback(notifiableEntity, otherEntity)
        }
    }
}

