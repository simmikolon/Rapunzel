//
//  RPPhysicsWorldContactDelegate.swift
//  RapunzelSwift
//
//  Created by Simon Kemper on 13.11.15.
//  Copyright © 2015 Simon Kemper. All rights reserved.
//

import SpriteKit

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

class RPPhysicsWorldContactDelegate: RPObject, SKPhysicsContactDelegate {
    
    func didBeginContact(contact: SKPhysicsContact) {
    
        if let nodeA = contact.bodyA.node as? ContactableNode {
            
            if let nodeB = contact.bodyB.node as? ContactableNode {
             
                nodeA.didBeginContact(withNode: nodeB as! SKNode)
                nodeB.didBeginContact(withNode: nodeA as! SKNode)
            }
        }
    }
}
