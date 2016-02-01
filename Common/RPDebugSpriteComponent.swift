//
//  RPDebugSpriteComponent.swift
//  Rapunzel
//
//  Created by Simon Kemper on 27.01.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

class RPDebugSpriteComponent: GKComponent {
    
    var node: SKNode!
    
    init(withNode node: SKNode? = nil, length: CGFloat = 32) {

        if node != nil {
            
            self.node = SKSpriteNode(color: UIColor.whiteColor(), size: CGSize(width: length, height: 32))
            node?.addChild(self.node)
        }
    }
}
