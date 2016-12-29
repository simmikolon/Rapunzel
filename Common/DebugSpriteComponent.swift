//
//  DebugSpriteComponent.swift
//  Rapunzel
//
//  Created by Simon Kemper on 27.01.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

class DebugSpriteComponent: GKComponent {
    
    var node: SKNode!
    
    init(withNode node: SKNode? = nil, length: CGFloat = 32) {
        
        super.init()

        if node != nil {
            
            self.node = SKSpriteNode(color: SKColor.white, size: CGSize(width: length, height: 32))
            node?.addChild(self.node)
        }
    }

    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
}
