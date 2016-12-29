//
//  LifecycleComponent.swift
//  Rapunzel
//
//  Created by Simon Kemper on 29.04.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

protocol LifecycleComponentDelegate: class {
    func nodeDidExitScreen(_ node: SKNode)
}

class LifecycleComponent: GKComponent {

    unowned let node: SKNode
    unowned let delegate: LifecycleComponentDelegate
    
    init(withEntity entity: GKEntity, delegate: LifecycleComponentDelegate) {
        
        guard let renderComponent = entity.component(ofType: RenderComponent.self) else {
            fatalError()
        }
        
        self.node = renderComponent.node
        self.delegate = delegate
        
        super.init()
    }

    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    override func update(deltaTime seconds: TimeInterval) {
        
        super.update(deltaTime: seconds)
        
        if let position = node.scene?.convert(node.position, from: node.parent!) {
         
            if position.y < -100 {
                
                self.delegate.nodeDidExitScreen(node)
            }
        }
    }
}
