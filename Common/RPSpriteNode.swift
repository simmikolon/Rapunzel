//
//  RPSpriteNode.swift
//  RapunzelSwift
//
//  Created by Simon Kemper on 13.11.15.
//  Copyright © 2015 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

class RPSpriteNode: SKSpriteNode, ContactableNode {
    
    weak var entity: GKEntity!

    func setup() {
        
    }
    
    func didBeginContact(withNode node: SKNode) {
        
    }
}
